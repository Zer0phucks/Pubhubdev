import { useMemo } from 'react';
import { Platform, PLATFORM_CONSTRAINTS } from '../types';

export interface PlatformConstraints {
  maxLength: number;
  maxImages: number;
  maxVideos: number;
  supportsThreads: boolean;
  supportsHashtags: boolean;
  maxHashtags?: number;
}

export interface ContentValidation {
  isValid: boolean;
  issues: string[];
  characterCount: number;
  imageCount: number;
  videoCount: number;
}

/**
 * Hook to get platform-specific constraints and validation
 *
 * @param platform - The platform to get constraints for
 * @returns Platform constraints and validation function
 *
 * @example
 * const { constraints, validateContent } = usePlatformConstraints('twitter');
 * const validation = validateContent(content, images, videos);
 * if (!validation.isValid) {
 *   console.log(validation.issues);
 * }
 */
export function usePlatformConstraints(platform: Platform) {
  const constraints = useMemo<PlatformConstraints>(
    () => PLATFORM_CONSTRAINTS[platform],
    [platform]
  );

  const validateContent = useMemo(
    () => (content: string, imageCount: number = 0, videoCount: number = 0): ContentValidation => {
      const characterCount = content.length;
      const issues: string[] = [];

      // Character limit validation
      if (characterCount > constraints.maxLength) {
        issues.push(
          `Exceeds character limit (${characterCount}/${constraints.maxLength})`
        );
      }

      // Image limit validation
      if (imageCount > constraints.maxImages) {
        issues.push(
          `Too many images (${imageCount}/${constraints.maxImages})`
        );
      }

      // Video limit validation
      if (videoCount > constraints.maxVideos) {
        issues.push(
          `Too many videos (${videoCount}/${constraints.maxVideos})`
        );
      }

      // Content required validation
      if (characterCount === 0 && imageCount === 0 && videoCount === 0) {
        issues.push('Content, image, or video is required');
      }

      return {
        isValid: issues.length === 0,
        issues,
        characterCount,
        imageCount,
        videoCount,
      };
    },
    [constraints]
  );

  const canAddImage = useMemo(
    () => (currentImageCount: number) => currentImageCount < constraints.maxImages,
    [constraints.maxImages]
  );

  const canAddVideo = useMemo(
    () => (currentVideoCount: number) => currentVideoCount < constraints.maxVideos,
    [constraints.maxVideos]
  );

  const getRemainingChars = useMemo(
    () => (contentLength: number) => Math.max(0, constraints.maxLength - contentLength),
    [constraints.maxLength]
  );

  return {
    constraints,
    validateContent,
    canAddImage,
    canAddVideo,
    getRemainingChars,
  };
}
