import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { app } from '../../supabase/functions/server/index'; // Import the Hono app

// Mock environment variables
const mockEnv = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  FRONTEND_URL: 'https://pubhub.dev',
};

// Mock Deno.env
global.Deno = {
  env: {
    get: (key: string) => mockEnv[key as keyof typeof mockEnv],
  },
} as any;

// Mock fetch for external API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock KV store
const mockKV = {
  data: new Map(),
  async get(key: string) {
    return this.data.get(key);
  },
  async set(key: string, value: any, options?: any) {
    this.data.set(key, value);
  },
  async del(key: string) {
    this.data.delete(key);
  },
};

// Mock the KV module
vi.mock('./kv_store.tsx', () => ({
  default: mockKV,
}));

describe('Supabase Edge Functions', () => {
  beforeEach(() => {
    mockKV.data.clear();
    vi.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await fetch('/make-server-19ccd85e/health');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({ status: 'ok' });
    });
  });

  describe('Authentication', () => {
    it('should initialize user on first login', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      // Mock Supabase auth
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      } as Response);

      const response = await fetch('/make-server-19ccd85e/auth/initialize', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe('test-user-id');
      expect(data.user.email).toBe('test@example.com');
    });

    it('should get user profile', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      // Mock Supabase auth
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      } as Response);

      // Set up mock profile data
      await mockKV.set('user:test-user-id:profile', {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
      });

      const response = await fetch('/make-server-19ccd85e/auth/profile', {
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe('test-user-id');
    });
  });

  describe('Posts Management', () => {
    beforeEach(async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      // Mock Supabase auth
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      } as Response);

      // Set up test data
      await mockKV.set('user:test-user-id:posts', ['post-1', 'post-2']);
      await mockKV.set('post:post-1', {
        id: 'post-1',
        userId: 'test-user-id',
        content: 'Test post 1',
        status: 'draft',
        createdAt: new Date().toISOString(),
      });
      await mockKV.set('post:post-2', {
        id: 'post-2',
        userId: 'test-user-id',
        content: 'Test post 2',
        status: 'published',
        createdAt: new Date().toISOString(),
      });
    });

    it('should get all posts', async () => {
      const response = await fetch('/make-server-19ccd85e/posts', {
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.posts).toHaveLength(2);
      expect(data.posts[0].content).toBe('Test post 1');
    });

    it('should filter posts by status', async () => {
      const response = await fetch('/make-server-19ccd85e/posts?status=draft', {
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.posts).toHaveLength(1);
      expect(data.posts[0].status).toBe('draft');
    });

    it('should create a new post', async () => {
      const newPost = {
        content: 'New test post',
        status: 'draft',
        platforms: ['twitter'],
      };

      const response = await fetch('/make-server-19ccd85e/posts', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPost),
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.post).toBeDefined();
      expect(data.post.content).toBe('New test post');
      expect(data.post.userId).toBe('test-user-id');
    });

    it('should update an existing post', async () => {
      const updates = {
        content: 'Updated post content',
        status: 'published',
      };

      const response = await fetch('/make-server-19ccd85e/posts/post-1', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.post.content).toBe('Updated post content');
      expect(data.post.status).toBe('published');
    });

    it('should delete a post', async () => {
      const response = await fetch('/make-server-19ccd85e/posts/post-1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.message).toBe('Post deleted successfully');
    });
  });

  describe('Project Management', () => {
    beforeEach(async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      // Mock Supabase auth
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      } as Response);

      // Set up test project
      await mockKV.set('user:test-user-id:projects', ['project-1']);
      await mockKV.set('project:project-1', {
        id: 'project-1',
        userId: 'test-user-id',
        name: 'Test Project',
        description: 'A test project',
        createdAt: new Date().toISOString(),
      });
    });

    it('should get all projects', async () => {
      const response = await fetch('/make-server-19ccd85e/projects', {
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.projects).toHaveLength(1);
      expect(data.projects[0].name).toBe('Test Project');
    });

    it('should create a new project', async () => {
      const newProject = {
        name: 'New Test Project',
        description: 'A new test project',
      };

      const response = await fetch('/make-server-19ccd85e/projects', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.project).toBeDefined();
      expect(data.project.name).toBe('New Test Project');
      expect(data.project.userId).toBe('test-user-id');
    });

    it('should update an existing project', async () => {
      const updates = {
        name: 'Updated Project Name',
        description: 'Updated description',
      };

      const response = await fetch('/make-server-19ccd85e/projects/project-1', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.project.name).toBe('Updated Project Name');
      expect(data.project.description).toBe('Updated description');
    });
  });

  describe('OAuth Integration', () => {
    beforeEach(async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      // Mock Supabase auth
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      } as Response);
    });

    it('should generate OAuth authorization URL', async () => {
      const response = await fetch('/make-server-19ccd85e/oauth/authorize/twitter?projectId=project-1', {
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.authUrl).toContain('twitter.com/i/oauth2/authorize');
      expect(data.state).toBeDefined();
    });

    it('should handle OAuth callback', async () => {
      // Mock token exchange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
        }),
      } as Response);

      // Mock user info fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: {
            id: 'twitter-user-id',
            username: 'testuser',
            name: 'Test User',
          },
        }),
      } as Response);

      // Set up state
      const state = 'test-user-id:project-1:1234567890:abc123';
      await mockKV.set(`oauth:state:${state}`, {
        userId: 'test-user-id',
        projectId: 'project-1',
        platform: 'twitter',
        createdAt: Date.now(),
      });

      const callbackData = {
        code: 'test-auth-code',
        state,
        platform: 'twitter',
      };

      const response = await fetch('/make-server-19ccd85e/oauth/callback', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(callbackData),
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.platform).toBe('twitter');
      expect(data.username).toBe('testuser');
    });
  });

  describe('File Upload', () => {
    beforeEach(async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      // Mock Supabase auth
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      } as Response);

      // Mock Supabase storage
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: { signedUrl: 'https://test.supabase.co/storage/v1/object/sign/test-bucket/test-file.jpg' },
        }),
      } as Response);
    });

    it('should upload profile picture', async () => {
      // Mock Supabase auth
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      });

      const formData = new FormData();
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const req = new Request('http://localhost/make-server-19ccd85e/upload/profile-picture', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer valid-token' },
        body: formData,
      });
      const res = await app.fetch(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.url).toBe('http://mock.url/file.jpg');
      expect(body.path).toBe('profile-pictures/test-user-id.png');
    });

    it('should reject invalid file types', async () => {
      // Mock Supabase auth
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      });

      const formData = new FormData();
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      formData.append('file', file);

      const req = new Request('http://localhost/make-server-19ccd85e/upload/profile-picture', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer valid-token' },
        body: formData,
      });
      const res = await app.fetch(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid file type');
    });

    it('should reject oversized files', async () => {
      // Mock Supabase auth
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      });

      const formData = new FormData();
      // Create a large file (6MB)
      const largeContent = 'x'.repeat(6 * 1024 * 1024);
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const req = new Request('http://localhost/make-server-19ccd85e/upload/profile-picture', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer valid-token' },
        body: formData,
      });
      const res = await app.fetch(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('File size exceeds 5MB limit');
    });
  });
});
