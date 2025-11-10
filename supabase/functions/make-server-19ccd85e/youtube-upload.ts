/**
 * YouTube Video Upload Helper
 *
 * YouTube requires resumable upload protocol for large video files.
 * This implementation supports chunked upload for reliability.
 *
 * API Reference: https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol
 */

interface YouTubeUploadOptions {
  videoUrl: string;           // URL of the video to upload
  accessToken: string;        // YouTube OAuth access token
  title: string;              // Video title
  description?: string;       // Video description
  tags?: string[];            // Video tags
  categoryId?: string;        // Category ID (default: "22" = People & Blogs)
  privacyStatus?: "public" | "private" | "unlisted"; // Privacy setting
}

interface YouTubeUploadResult {
  success: boolean;
  videoId?: string;
  url?: string;
  error?: string;
}

interface VideoMetadata {
  snippet: {
    title: string;
    description: string;
    tags?: string[];
    categoryId: string;
  };
  status: {
    privacyStatus: string;
    embeddable: boolean;
    publicStatsViewable: boolean;
  };
}

/**
 * Fetch video from URL as ArrayBuffer
 */
async function fetchVideoAsBuffer(videoUrl: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    // Validate content type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("video/")) {
      throw new Error(
        `Invalid content type: ${contentType}. Expected video/*`
      );
    }

    return await response.arrayBuffer();
  } catch (error: any) {
    throw new Error(`Error fetching video: ${error.message}`);
  }
}

/**
 * Validate video size (practical limit: 2 GB for Edge Functions)
 * YouTube's actual limit is 256 GB, but Edge Functions have limitations
 */
function validateVideoSize(size: number): void {
  const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB (practical limit)
  const YOUTUBE_LIMIT = 256 * 1024 * 1024 * 1024; // 256 GB (YouTube limit)

  if (size > MAX_SIZE) {
    throw new Error(
      `Video size (${(size / 1024 / 1024 / 1024).toFixed(2)} GB) exceeds practical limit of 2 GB for Edge Functions. ` +
      `For larger videos, use direct client-side upload. YouTube's limit is ${YOUTUBE_LIMIT / 1024 / 1024 / 1024} GB.`
    );
  }
}

/**
 * Step 1: Initialize resumable upload session
 * Returns upload URL for subsequent chunks
 */
async function initializeResumableUpload(
  accessToken: string,
  metadata: VideoMetadata
): Promise<string> {
  const response = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "video/*",
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to initialize resumable upload: ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  const uploadUrl = response.headers.get("Location");
  if (!uploadUrl) {
    throw new Error("YouTube did not return upload URL in Location header");
  }

  return uploadUrl;
}

/**
 * Step 2: Upload video in chunks (resumable upload)
 * For simplicity, this uploads the entire video at once
 * For production, implement chunking for large files
 */
async function uploadVideoChunks(
  uploadUrl: string,
  videoBuffer: ArrayBuffer,
  accessToken: string
): Promise<any> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "video/*",
      "Content-Length": videoBuffer.byteLength.toString(),
    },
    body: videoBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Video upload failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Advanced: Upload video in chunks for large files
 * This is more robust for unreliable networks
 */
async function uploadVideoInChunks(
  uploadUrl: string,
  videoBuffer: ArrayBuffer,
  accessToken: string,
  chunkSize: number = 5 * 1024 * 1024 // 5 MB chunks
): Promise<any> {
  const totalSize = videoBuffer.byteLength;
  let uploadedBytes = 0;

  while (uploadedBytes < totalSize) {
    const start = uploadedBytes;
    const end = Math.min(uploadedBytes + chunkSize, totalSize);
    const chunk = videoBuffer.slice(start, end);

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "video/*",
        "Content-Length": chunk.byteLength.toString(),
        "Content-Range": `bytes ${start}-${end - 1}/${totalSize}`,
      },
      body: chunk,
    });

    if (response.status === 308) {
      // Resume incomplete
      const rangeHeader = response.headers.get("Range");
      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=0-(\d+)/);
        if (match) {
          uploadedBytes = parseInt(match[1], 10) + 1;
        }
      }
      continue;
    }

    if (!response.ok && response.status !== 200 && response.status !== 201) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(
        `Chunk upload failed at ${start}-${end}: ${response.status} - ${errorText}`
      );
    }

    if (response.status === 200 || response.status === 201) {
      // Upload complete
      return await response.json();
    }

    uploadedBytes = end;
  }

  throw new Error("Upload completed but no final response received");
}

/**
 * Main function: Upload video to YouTube
 *
 * @param options - Upload options
 * @returns Result with videoId and URL on success
 */
export async function uploadVideoToYouTube(
  options: YouTubeUploadOptions
): Promise<YouTubeUploadResult> {
  const {
    videoUrl,
    accessToken,
    title,
    description = "",
    tags = [],
    categoryId = "22", // People & Blogs
    privacyStatus = "public",
  } = options;

  try {
    // Fetch video from URL
    console.log("Fetching video from URL...");
    const videoBuffer = await fetchVideoAsBuffer(videoUrl);

    // Validate video size
    const videoSize = videoBuffer.byteLength;
    validateVideoSize(videoSize);
    console.log(
      `Video size: ${(videoSize / 1024 / 1024).toFixed(2)} MB`
    );

    // Prepare metadata
    const metadata: VideoMetadata = {
      snippet: {
        title,
        description,
        tags,
        categoryId,
      },
      status: {
        privacyStatus,
        embeddable: true,
        publicStatsViewable: true,
      },
    };

    // Step 1: Initialize resumable upload
    console.log("Initializing resumable upload...");
    const uploadUrl = await initializeResumableUpload(accessToken, metadata);

    // Step 2: Upload video
    console.log("Uploading video...");
    let uploadResult;

    // Use chunked upload for files > 50 MB
    if (videoSize > 50 * 1024 * 1024) {
      uploadResult = await uploadVideoInChunks(
        uploadUrl,
        videoBuffer,
        accessToken
      );
    } else {
      uploadResult = await uploadVideoChunks(
        uploadUrl,
        videoBuffer,
        accessToken
      );
    }

    const videoId = uploadResult.id;
    if (!videoId) {
      throw new Error("YouTube did not return video ID");
    }

    console.log(`Video uploaded successfully: ${videoId}`);

    return {
      success: true,
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch (error: any) {
    console.error("YouTube upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Helper: Check upload status (for resumable uploads)
 */
export async function checkUploadStatus(
  uploadUrl: string,
  accessToken: string
): Promise<{ uploaded: number; total: number }> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Range": "bytes */*",
    },
  });

  if (response.status === 308) {
    const rangeHeader = response.headers.get("Range");
    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=0-(\d+)/);
      if (match) {
        return {
          uploaded: parseInt(match[1], 10) + 1,
          total: 0, // Unknown
        };
      }
    }
  }

  return { uploaded: 0, total: 0 };
}
