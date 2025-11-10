/**
 * LinkedIn Image Upload Helper
 *
 * LinkedIn requires a multi-step upload process:
 * 1. Register the upload (get upload URL and asset URN)
 * 2. Upload image binary to LinkedIn CDN
 * 3. Create post with uploaded image reference
 *
 * API Reference: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/images-api
 */

interface LinkedInUploadResult {
  success: boolean;
  assetUrn?: string;
  error?: string;
}

interface LinkedInImageUploadOptions {
  imageUrl: string;           // URL of the image to upload
  accessToken: string;        // LinkedIn OAuth access token
  authorUrn: string;          // Author URN (e.g., urn:li:person:12345)
}

/**
 * Fetch image from URL as ArrayBuffer
 */
async function fetchImageAsBuffer(imageUrl: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Validate content type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      throw new Error(`Invalid content type: ${contentType}. Expected image/*`);
    }

    return await response.arrayBuffer();
  } catch (error: any) {
    throw new Error(`Error fetching image: ${error.message}`);
  }
}

/**
 * Get image size from ArrayBuffer
 */
function getImageSize(buffer: ArrayBuffer): number {
  return buffer.byteLength;
}

/**
 * Validate image size (LinkedIn limits to 10 MB)
 */
function validateImageSize(size: number): void {
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  if (size > MAX_SIZE) {
    throw new Error(
      `Image size (${(size / 1024 / 1024).toFixed(2)} MB) exceeds LinkedIn limit of 10 MB`
    );
  }
}

/**
 * Step 1: Register upload with LinkedIn
 * Returns upload URL and asset URN
 */
async function registerUpload(
  accessToken: string,
  authorUrn: string
): Promise<{ uploadUrl: string; assetUrn: string }> {
  const registerPayload = {
    registerUploadRequest: {
      recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
      owner: authorUrn,
      serviceRelationships: [
        {
          relationshipType: "OWNER",
          identifier: "urn:li:userGeneratedContent",
        },
      ],
    },
  };

  const response = await fetch(
    "https://api.linkedin.com/v2/assets?action=registerUpload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(registerPayload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `LinkedIn register upload failed: ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  const uploadUrl =
    data.value?.uploadMechanism?.[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ]?.uploadUrl;
  const assetUrn = data.value?.asset;

  if (!uploadUrl || !assetUrn) {
    throw new Error(
      "LinkedIn register upload response missing uploadUrl or asset URN"
    );
  }

  return { uploadUrl, assetUrn };
}

/**
 * Step 2: Upload image binary to LinkedIn CDN
 */
async function uploadImageBinary(
  uploadUrl: string,
  imageBuffer: ArrayBuffer,
  accessToken: string
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    throw new Error(
      `LinkedIn image upload failed: ${response.status} ${response.statusText}`
    );
  }
}

/**
 * Main function: Upload image to LinkedIn
 *
 * @param options - Upload options
 * @returns Result with assetUrn on success
 */
export async function uploadImageToLinkedIn(
  options: LinkedInImageUploadOptions
): Promise<LinkedInUploadResult> {
  const { imageUrl, accessToken, authorUrn } = options;

  try {
    // Fetch image from URL
    const imageBuffer = await fetchImageAsBuffer(imageUrl);

    // Validate image size
    const imageSize = getImageSize(imageBuffer);
    validateImageSize(imageSize);

    // Step 1: Register upload
    const { uploadUrl, assetUrn } = await registerUpload(
      accessToken,
      authorUrn
    );

    // Step 2: Upload image binary
    await uploadImageBinary(uploadUrl, imageBuffer, accessToken);

    return {
      success: true,
      assetUrn,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create LinkedIn post with image
 *
 * @param accessToken - LinkedIn OAuth access token
 * @param authorUrn - Author URN (e.g., urn:li:person:12345)
 * @param text - Post text content
 * @param assetUrn - Asset URN from uploadImageToLinkedIn
 * @returns Post result with post ID
 */
export async function createLinkedInPostWithImage(
  accessToken: string,
  authorUrn: string,
  text: string,
  assetUrn: string
): Promise<{ success: boolean; postId?: string; url?: string; error?: string }> {
  try {
    const postBody = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text,
          },
          shareMediaCategory: "IMAGE",
          media: [
            {
              status: "READY",
              description: {
                text: "Image shared via PubHub",
              },
              media: assetUrn,
              title: {
                text: "PubHub Image",
              },
            },
          ],
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to post to LinkedIn");
    }

    return {
      success: true,
      postId: data.id,
      url: `https://linkedin.com/feed/update/${data.id}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
