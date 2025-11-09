// Mock localStorage before importing MSW
class LocalStorageMock {
  private store: { [key: string]: string } = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

if (typeof global !== 'undefined' && !global.localStorage) {
  global.localStorage = new LocalStorageMock() as Storage;
}

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock Supabase responses
const supabaseHandlers = [
  // Health check endpoint
  http.get('*/make-server-19ccd85e/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  // Auth endpoints
  http.post('*/make-server-19ccd85e/auth/initialize', () => {
    return HttpResponse.json({ 
      message: 'User initialized successfully',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }
    });
  }),

  http.get('*/make-server-19ccd85e/auth/profile', () => {
    return HttpResponse.json({ 
      user: { 
        id: 'test-user-id', 
        name: 'Test User',
        profilePicture: null 
      } 
    });
  }),

  // Posts endpoints
  http.get('*/make-server-19ccd85e/posts', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    
    let posts = [
      { id: 'post-1', content: 'Test post 1', status: 'draft', platforms: ['twitter'] },
      { id: 'post-2', content: 'Test post 2', status: 'published', platforms: ['instagram'] }
    ];
    
    if (status) {
      posts = posts.filter(post => post.status === status);
    }
    
    return HttpResponse.json({ posts });
  }),

  http.post('*/make-server-19ccd85e/posts', () => {
    return HttpResponse.json({ 
      post: { 
        id: 'post-new', 
        content: 'New test post', 
        status: 'draft',
        platforms: ['twitter'],
        userId: 'test-user-id'
      } 
    });
  }),

  http.put('*/make-server-19ccd85e/posts/*', () => {
    return HttpResponse.json({ 
      post: { 
        id: 'post-1', 
        content: 'Updated post content', 
        status: 'published' 
      } 
    });
  }),

  http.delete('*/make-server-19ccd85e/posts/*', () => {
    return HttpResponse.json({ message: 'Post deleted successfully' });
  }),

  // Projects endpoints
  http.get('*/make-server-19ccd85e/projects', () => {
    return HttpResponse.json({ 
      projects: [
        { id: 'project-1', name: 'Test Project', description: 'A test project' }
      ] 
    });
  }),

  http.post('*/make-server-19ccd85e/projects', () => {
    return HttpResponse.json({ 
      project: { 
        id: 'project-new', 
        name: 'New Test Project', 
        description: 'A new test project',
        userId: 'test-user-id'
      } 
    });
  }),

  http.put('*/make-server-19ccd85e/projects/*', () => {
    return HttpResponse.json({ 
      project: { 
        id: 'project-1', 
        name: 'Updated Project Name', 
        description: 'Updated description' 
      } 
    });
  }),

  // OAuth endpoints
  http.get('*/make-server-19ccd85e/oauth/authorize/*', () => {
    return HttpResponse.json({ 
      authUrl: 'https://twitter.com/i/oauth2/authorize?client_id=test&redirect_uri=test',
      state: 'test-state'
    });
  }),

  http.post('*/make-server-19ccd85e/oauth/callback', () => {
    return HttpResponse.json({ 
      success: true,
      platform: 'twitter',
      username: 'testuser'
    });
  }),

  // File upload endpoints
  http.post('*/make-server-19ccd85e/upload/profile-picture', async ({ request }) => {
    try {
      // Handle both FormData and regular requests
      let file: File | null = null;
      
      if (request.headers.get('content-type')?.includes('multipart/form-data')) {
        const formData = await request.formData();
        file = formData.get('file') as File;
      } else {
        // For test environment, try to parse as FormData anyway
        try {
          const formData = await request.formData();
          file = formData.get('file') as File;
        } catch (e) {
          // If that fails, return error
          return HttpResponse.json({ 
            error: 'Invalid request format' 
          }, { status: 400 });
        }
      }
      
      if (!file) {
        return HttpResponse.json({ 
          error: 'No file provided' 
        }, { status: 400 });
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        return HttpResponse.json({ 
          error: 'Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG are allowed.' 
        }, { status: 400 });
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return HttpResponse.json({ 
          error: 'File size exceeds 5MB limit' 
        }, { status: 400 });
      }
      
      return HttpResponse.json({ 
        url: 'http://mock.url/file.jpg',
        path: 'profile-pictures/test-user-id.png'
      });
    } catch (error) {
      console.error('File upload error:', error);
      return HttpResponse.json({ 
        error: 'Invalid request' 
      }, { status: 400 });
    }
  }),

  // Auth endpoints
  http.post('*/auth/v1/signup', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      },
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      },
    });
  }),

  http.post('*/auth/v1/token', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      },
    });
  }),

  // Database endpoints
  http.get('*/rest/v1/projects', () => {
    return HttpResponse.json([
      {
        id: 'project-1',
        name: 'Test Project',
        description: 'A test project',
        created_at: new Date().toISOString(),
        user_id: 'test-user-id',
      },
    ]);
  }),

  http.post('*/rest/v1/projects', () => {
    return HttpResponse.json({
      id: 'new-project-id',
      name: 'New Project',
      description: 'A new test project',
      created_at: new Date().toISOString(),
      user_id: 'test-user-id',
    });
  }),

  // Content endpoints
  http.get('*/rest/v1/content', () => {
    return HttpResponse.json([
      {
        id: 'content-1',
        title: 'Test Content',
        content: 'This is test content',
        platform: 'twitter',
        status: 'draft',
        created_at: new Date().toISOString(),
        project_id: 'project-1',
      },
    ]);
  }),

  // Analytics endpoints
  http.get('*/rest/v1/analytics', () => {
    return HttpResponse.json({
      views: 1000,
      likes: 50,
      shares: 25,
      comments: 10,
    });
  }),
];

// Mock external API endpoints
const externalHandlers = [
  // Twitter API
  http.post('https://api.twitter.com/2/tweets', () => {
    return HttpResponse.json({
      data: {
        id: 'tweet-id',
        text: 'Test tweet content',
      },
    });
  }),

  // Instagram API
  http.post('https://graph.instagram.com/v18.0/me/media', () => {
    return HttpResponse.json({
      id: 'instagram-post-id',
      media_type: 'IMAGE',
      media_url: 'https://example.com/image.jpg',
    });
  }),

  // LinkedIn API
  http.post('https://api.linkedin.com/v2/ugcPosts', () => {
    return HttpResponse.json({
      id: 'linkedin-post-id',
      text: 'Test LinkedIn post',
    });
  }),
];

export const server = setupServer(...supabaseHandlers, ...externalHandlers);
