import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPlatformName, isPlatformConnected, arePlatformsConnected } from '@/utils/platformHelpers';
import { connectionsAPI } from '@/utils/api';

// Mock the API module
vi.mock('@/utils/api', () => ({
  connectionsAPI: {
    getAll: vi.fn(),
  },
}));

describe('platformHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlatformName', () => {
    it('returns correct display name for each platform', () => {
      expect(getPlatformName('twitter')).toBe('Twitter / X');
      expect(getPlatformName('instagram')).toBe('Instagram');
      expect(getPlatformName('linkedin')).toBe('LinkedIn');
      expect(getPlatformName('facebook')).toBe('Facebook');
      expect(getPlatformName('youtube')).toBe('YouTube');
      expect(getPlatformName('tiktok')).toBe('TikTok');
      expect(getPlatformName('pinterest')).toBe('Pinterest');
      expect(getPlatformName('reddit')).toBe('Reddit');
      expect(getPlatformName('blog')).toBe('Blog / WordPress');
    });

    it('returns platform name as fallback for unknown platform', () => {
      expect(getPlatformName('unknown' as any)).toBe('unknown');
    });
  });

  describe('isPlatformConnected', () => {
    it('returns true when platform is connected', async () => {
      const mockConnections = [
        { platform: 'twitter', connected: true },
        { platform: 'instagram', connected: false },
      ];
      vi.mocked(connectionsAPI.getAll).mockResolvedValue({ connections: mockConnections });

      const result = await isPlatformConnected('twitter');
      expect(result).toBe(true);
    });

    it('returns false when platform is not connected', async () => {
      const mockConnections = [
        { platform: 'twitter', connected: true },
        { platform: 'instagram', connected: false },
      ];
      vi.mocked(connectionsAPI.getAll).mockResolvedValue({ connections: mockConnections });

      const result = await isPlatformConnected('instagram');
      expect(result).toBe(false);
    });

    it('returns false when API call fails', async () => {
      vi.mocked(connectionsAPI.getAll).mockRejectedValue(new Error('API Error'));

      const result = await isPlatformConnected('twitter');
      expect(result).toBe(false);
    });
  });

  describe('arePlatformsConnected', () => {
    it('returns correct status for all connected platforms', async () => {
      const mockConnections = [
        { platform: 'twitter', connected: true },
        { platform: 'instagram', connected: true },
        { platform: 'linkedin', connected: true },
      ];
      vi.mocked(connectionsAPI.getAll).mockResolvedValue({ connections: mockConnections });

      const result = await arePlatformsConnected(['twitter', 'instagram', 'linkedin']);
      expect(result).toEqual({
        allConnected: true,
        connected: ['twitter', 'instagram', 'linkedin'],
        notConnected: [],
      });
    });

    it('returns correct status for partially connected platforms', async () => {
      const mockConnections = [
        { platform: 'twitter', connected: true },
        { platform: 'instagram', connected: false },
        { platform: 'linkedin', connected: true },
      ];
      vi.mocked(connectionsAPI.getAll).mockResolvedValue({ connections: mockConnections });

      const result = await arePlatformsConnected(['twitter', 'instagram', 'linkedin']);
      expect(result).toEqual({
        allConnected: false,
        connected: ['twitter', 'linkedin'],
        notConnected: ['instagram'],
      });
    });

    it('returns correct status for no connected platforms', async () => {
      const mockConnections = [
        { platform: 'twitter', connected: false },
        { platform: 'instagram', connected: false },
      ];
      vi.mocked(connectionsAPI.getAll).mockResolvedValue({ connections: mockConnections });

      const result = await arePlatformsConnected(['twitter', 'instagram']);
      expect(result).toEqual({
        allConnected: false,
        connected: [],
        notConnected: ['twitter', 'instagram'],
      });
    });

    it('handles API errors gracefully', async () => {
      vi.mocked(connectionsAPI.getAll).mockRejectedValue(new Error('API Error'));

      const result = await arePlatformsConnected(['twitter', 'instagram']);
      expect(result).toEqual({
        allConnected: false,
        connected: [],
        notConnected: ['twitter', 'instagram'],
      });
    });
  });
});
