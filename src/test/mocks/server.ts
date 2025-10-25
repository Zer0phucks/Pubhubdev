import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock Supabase responses
const supabaseHandlers = [
  // Health check endpoint
  http.get('*/make-server-19ccd85e/health', () => {
    return HttpResponse.json({ status: 'ok' });
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
