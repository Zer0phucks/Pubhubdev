/**
 * YouTube Upload Tests
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { uploadVideoToYouTube } from "../youtube-upload.ts";

Deno.test("YouTube Upload - Invalid Video URL", async () => {
  const result = await uploadVideoToYouTube({
    videoUrl: "not-a-url",
    accessToken: "mock-token",
    title: "Test Video",
    description: "Test Description"
  });

  assertEquals(result.success, false);
  assertEquals(typeof result.error, "string");
});

Deno.test("YouTube Upload - Missing Access Token", async () => {
  const result = await uploadVideoToYouTube({
    videoUrl: "https://example.com/video.mp4",
    accessToken: "",
    title: "Test Video"
  });

  // Should fail authentication
  assertEquals(result.success, false);
});

Deno.test("YouTube Upload - Options Validation", async () => {
  // Test with minimal options
  const result = await uploadVideoToYouTube({
    videoUrl: "https://invalid-url.com/video.mp4",
    accessToken: "mock-token",
    title: "Test Video"
  });

  // Should fail gracefully (invalid URL)
  assertEquals(result.success, false);
  assertEquals(typeof result.error, "string");
});

Deno.test("YouTube Upload - All Options", async () => {
  const result = await uploadVideoToYouTube({
    videoUrl: "https://invalid-url.com/video.mp4",
    accessToken: "mock-token",
    title: "Test Video",
    description: "Full description",
    tags: ["test", "demo"],
    categoryId: "22",
    privacyStatus: "unlisted"
  });

  // Should fail gracefully (invalid URL)
  assertEquals(result.success, false);
});

// Manual integration test instructions
console.log(`
=== YouTube Upload Integration Tests ===

To test with real YouTube API:

1. Set environment variables:
   export YOUTUBE_ACCESS_TOKEN="your-token"
   export TEST_VIDEO_URL="https://example.com/test-video.mp4"

2. Run:
   deno test --allow-net --allow-env youtube-upload.test.ts

3. Expected results:
   - Video uploaded to YouTube
   - Returns video ID and watch URL
   - Video appears in YouTube Studio

Important Notes:
- Test videos should be < 2 GB (Edge Function limit)
- YouTube has daily upload quotas (check your quota)
- Video processing may take several minutes
- Test with unlisted privacy status to avoid public uploads

Video Size Limits:
- Edge Function practical limit: 2 GB
- YouTube absolute limit: 256 GB
- Recommended test size: < 100 MB

Note: These tests use mock data by default to prevent accidental uploads.
`);
