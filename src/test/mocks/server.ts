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

// Mock API responses (replacing Supabase endpoints)
const apiHandlers = [
  // Health check endpoint
  http.get('*/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  // Auth endpoints
  http.post('*/api/auth/initialize', () => {
    return HttpResponse.json({ 
      message: 'User initialized successfully',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }
    });
  }),

  http.get('*/api/auth/profile', () => {
    return HttpResponse.json({ 
      user: { 
        id: 'test-user-id', 
        name: 'Test User',
        profilePicture: null 
      } 
    });
  }),

  // Posts endpoints
  http.get('*/api/posts', ({ request }) => {
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

  http.post('*/api/posts', () => {
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

  http.put('*/api/posts/*', () => {
    return HttpResponse.json({ 
      post: { 
        id: 'post-1', 
        content: 'Updated post content', 
        status: 'published' 
      } 
    });
  }),

  http.delete('*/api/posts/*', () => {
    return HttpResponse.json({ message: 'Post deleted successfully' });
  }),

  // Projects endpoints
  http.get('*/api/projects', () => {
    return HttpResponse.json({ 
      projects: [
        { id: 'project-1', name: 'Test Project', description: 'A test project' }
      ] 
    });
  }),

  http.post('*/api/projects', () => {
    return HttpResponse.json({ 
      project: { 
        id: 'project-new', 
        name: 'New Test Project', 
        description: 'A new test project',
        userId: 'test-user-id'
      } 
    });
  }),

  http.put('*/api/projects/*', () => {
    return HttpResponse.json({ 
      project: { 
        id: 'project-1', 
        name: 'Updated Project Name', 
        description: 'Updated description' 
      } 
    });
  }),

  // OAuth endpoints
  http.get('*/api/oauth/authorize/*', () => {
    return HttpResponse.json({ 
      authUrl: 'https://twitter.com/i/oauth2/authorize?client_id=test&redirect_uri=test',
      state: 'test-state'
    });
  }),

  http.post('*/api/oauth/callback', () => {
    return HttpResponse.json({ 
      success: true,
      platform: 'twitter',
      username: 'testuser'
    });
  }),

  // File upload endpoints
  http.post('*/api/upload/profile-picture', async ({ request }) => {
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

export const server = setupServer(...apiHandlers, ...externalHandlers);
