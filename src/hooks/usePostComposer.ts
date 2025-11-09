import { useState, useCallback, useMemo } from 'react';
import { Platform, Attachment, ScheduledPost } from '../types';
import { postsAPI } from '../utils/api';
import { toast } from 'sonner';
import { logger } from '../utils/logger';

export interface PostComposerState {
  content: string;
  platforms: Platform[];
  attachments: Attachment[];
  scheduledTime: Date | null;
  isDraft: boolean;
  isPublishing: boolean;
  publishingPlatforms: Set<Platform>;
}

export interface PostComposerActions {
  setContent: (content: string) => void;
  togglePlatform: (platform: Platform) => void;
  setPlatforms: (platforms: Platform[]) => void;
  addAttachment: (file: File) => void;
  removeAttachment: (index: number) => void;
  setScheduledTime: (time: Date | null) => void;
  setIsDraft: (isDraft: boolean) => void;
  save: () => Promise<void>;
  publish: (platform?: Platform, customContent?: string) => Promise<void>;
  reset: () => void;
}

export interface PostComposerValidation {
  isValid: boolean;
  issues: Record<Platform, string[]>;
}

/**
 * Hook to manage post composition state and logic
 *
 * @param projectId - Current project ID
 * @returns Post composer state, actions, and validation
 *
 * @example
 * const { state, actions, validate } = usePostComposer(projectId);
 *
 * actions.setContent('Hello World');
 * actions.togglePlatform('twitter');
 *
 * const validation = validate();
 * if (validation.isValid) {
 *   await actions.publish();
 * }
 */
export function usePostComposer(projectId: string) {
  const [content, setContent] = useState('');
  const [platforms, setPlatformsState] = useState<Platform[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingPlatforms, setPublishingPlatforms] = useState<Set<Platform>>(new Set());

  const state: PostComposerState = useMemo(
    () => ({
      content,
      platforms,
      attachments,
      scheduledTime,
      isDraft,
      isPublishing,
      publishingPlatforms,
    }),
    [content, platforms, attachments, scheduledTime, isDraft, isPublishing, publishingPlatforms]
  );

  const togglePlatform = useCallback((platform: Platform) => {
    setPlatformsState((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  }, []);

  const setPlatforms = useCallback((newPlatforms: Platform[]) => {
    setPlatformsState(newPlatforms);
  }, []);

  const addAttachment = useCallback((file: File) => {
    const attachment: Attachment = {
      name: file.name,
      size: file.size,
      type: file.type,
    };
    setAttachments((prev) => [...prev, attachment]);
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const save = useCallback(async () => {
    if (!projectId) {
      toast.error('No project selected');
      return;
    }

    try {
      setIsPublishing(true);

      await postsAPI.create({
        projectId,
        platforms,
        content,
        status: 'draft',
        attachments,
        scheduledAt: scheduledTime?.toISOString(),
      });

      toast.success('Draft saved successfully');
    } catch (error: unknown) {
      const err = toAppError(error);
      logger.error('Failed to save draft', error);
      toast.error(err.message || 'Failed to save draft');
      throw error;
    } finally {
      setIsPublishing(false);
    }
  }, [projectId, platforms, content, attachments, scheduledTime]);

  const publish = useCallback(
    async (platform?: Platform, customContent?: string) => {
      if (!projectId) {
        toast.error('No project selected');
        return;
      }

      const targetPlatform = platform;
      const publishContent = customContent || content;

      if (!targetPlatform) {
        toast.error('No platform selected');
        return;
      }

      setPublishingPlatforms((prev) => new Set(prev).add(targetPlatform));

      try {
        const { post } = await postsAPI.create({
          projectId,
          platforms: [targetPlatform],
          content: publishContent,
          status: 'publishing',
          attachments: attachments.filter((a: Attachment) => a.platform === targetPlatform),
        });

        // Note: Actual publishing to platforms would be handled by Edge Function
        // This is just the database record creation

        toast.success('Post published successfully', {
          description: `Published to ${targetPlatform}`,
        });
      } catch (error: unknown) {
        const err = toAppError(error);
        logger.error('Publishing error', error, { platform: targetPlatform });
        toast.error(err.message || 'Failed to publish post');
        throw error;
      } finally {
        setPublishingPlatforms((prev) => {
          const next = new Set(prev);
          next.delete(targetPlatform);
          return next;
        });
      }
    },
    [projectId, content, attachments]
  );

  const reset = useCallback(() => {
    setContent('');
    setPlatformsState([]);
    setAttachments([]);
    setScheduledTime(null);
    setIsDraft(false);
    setIsPublishing(false);
    setPublishingPlatforms(new Set());
  }, []);

  const actions: PostComposerActions = useMemo(
    () => ({
      setContent,
      togglePlatform,
      setPlatforms,
      addAttachment,
      removeAttachment,
      setScheduledTime,
      setIsDraft,
      save,
      publish,
      reset,
    }),
    [togglePlatform, setPlatforms, addAttachment, removeAttachment, save, publish, reset]
  );

  return {
    state,
    actions,
  };
}
