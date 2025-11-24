import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { requireAuth } from './middleware/auth';
import { rateLimiter, userRateLimiter, rateLimitConfigs } from './middleware/rate-limit';
import * as kv from './db/kv-store';
import { initializeBucket, uploadFile, getSignedUrlForFile } from './storage/spaces';
import { closePool } from './db/client';
import { getOAuthConfig } from './oauth/oauth-config';
import { fetchRedditTrending, fetchRedditTrendingAll, NormalizedTrendingPost } from './trending/reddit-fetcher';
import { query } from './db/client';
import { fetchURL, isValidURL } from './utils/contentFetcher';
import { chunkText, calculateReadabilityMetrics } from './utils/textUtils';
import { randomUUID } from 'crypto';
import type { AppContextType } from './types';

// Helper to generate random IDs
function randomId(): string {
  return randomUUID();
}

// Validate logo variant against whitelist to prevent SQL injection
const VALID_LOGO_VARIANTS = ['light', 'dark', 'square'] as const;
type LogoVariant = typeof VALID_LOGO_VARIANTS[number];

// Map variant to column name - prevents any possibility of SQL injection
const LOGO_VARIANT_COLUMN_MAP: Record<LogoVariant, string> = {
  light: 'logo_light_url',
  dark: 'logo_dark_url',
  square: 'logo_square_url',
};

function validateLogoVariant(variant: string | null | undefined): LogoVariant {
  if (!variant || !VALID_LOGO_VARIANTS.includes(variant as LogoVariant)) {
    return 'light'; // Default to 'light' if invalid
  }
  return variant as LogoVariant;
}

function getLogoColumnName(variant: LogoVariant): string {
  return LOGO_VARIANT_COLUMN_MAP[variant];
}

import type { AppContext } from './types';

const app = new Hono<AppContext>();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS
const frontendUrl = process.env.FRONTEND_URL || 'https://pubhub.dev';
app.use(
  '/*',
  cors({
    origin: frontendUrl,
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: [
      'Content-Length',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    maxAge: 600,
    credentials: true,
  })
);

// Apply global rate limiting
app.use('/*', rateLimiter(rateLimitConfigs.api));

// Initialize storage on startup
initializeBucket().catch((error) => {
  console.error('Failed to initialize storage:', error);
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============= UPLOAD ROUTES =============

// Upload profile picture
app.post(
  '/upload/profile-picture',
  requireAuth,
  userRateLimiter(rateLimitConfigs.upload),
  async (c) => {
    try {
      const userId = c.get('userId');
      const formData = await c.req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return c.json({ error: 'No file provided' }, 400);
      }

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];
      if (!allowedTypes.includes(file.type)) {
        return c.json(
          { error: 'Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG are allowed.' },
          400
        );
      }

      if (file.size > 5242880) {
        return c.json({ error: 'File size exceeds 5MB limit' }, 400);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `profile-pictures/${userId}.${fileExt}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { url } = await uploadFile(fileName, buffer, file.type, { public: false });

      // Generate signed URL for private access
      const signedUrl = await getSignedUrlForFile(fileName, 31536000); // 1 year

      // Update user profile
      const profile = (await kv.get(`user:${userId}:profile`)) || {};
      profile.profilePicture = signedUrl;
      profile.profilePicturePath = fileName;
      await kv.set(`user:${userId}:profile`, profile);

      return c.json({ url: signedUrl, path: fileName });
    } catch (error: any) {
      console.error('Profile picture upload error:', error);
      return c.json({ error: `Upload failed: ${error.message}` }, 500);
    }
  }
);

// Upload project logo
app.post(
  '/upload/project-logo/:projectId',
  requireAuth,
  userRateLimiter(rateLimitConfigs.upload),
  async (c) => {
    try {
      const userId = c.get('userId');
      const projectId = c.req.param('projectId');
      const formData = await c.req.formData();
      const file = formData.get('file') as File;
      const variant = validateLogoVariant(formData.get('variant') as string);

      if (!file) {
        return c.json({ error: 'No file provided' }, 400);
      }

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];
      if (!allowedTypes.includes(file.type)) {
        return c.json(
          { error: 'Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG are allowed.' },
          400
        );
      }

      if (file.size > 5242880) {
        return c.json({ error: 'File size exceeds 5MB limit' }, 400);
      }

      // Verify project ownership
      const projectResult = await query(
        'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
        [projectId, userId]
      );

      if (projectResult.rows.length === 0) {
        return c.json({ error: 'Project not found or access denied' }, 404);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `brand-assets/${projectId}/${variant}.${fileExt}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { url } = await uploadFile(fileName, buffer, file.type, { public: false });
      const signedUrl = await getSignedUrlForFile(fileName, 31536000);

      // Update brand record - use validated variant mapped to column name
      const logoField = getLogoColumnName(variant);
      await query(
        `UPDATE brands SET ${logoField} = $1, updated_at = NOW() WHERE project_id = $2`,
        [signedUrl, projectId]
      );

      return c.json({ url: signedUrl, path: fileName });
    } catch (error: any) {
      console.error('Project logo upload error:', error);
      return c.json({ error: `Upload failed: ${error.message}` }, 500);
    }
  }
);

// Delete project logo
app.delete('/upload/project-logo/delete', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { filePath } = await c.req.json();

    if (!filePath) {
      return c.json({ error: 'filePath is required' }, 400);
    }

    // Extract project ID from file path (brand-assets/{projectId}/{variant}.ext)
    const match = filePath.match(/brand-assets\/([^/]+)\//);
    if (!match) {
      return c.json({ error: 'Invalid file path' }, 400);
    }

    const projectId = match[1];

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    // Extract variant from file path and validate against whitelist
    const variantMatch = filePath.match(/brand-assets\/[^/]+\/([^/.]+)/);
    const variant = validateLogoVariant(variantMatch ? variantMatch[1] : null);

    // Update brand record to remove logo URL - use validated variant mapped to column name
    const logoField = getLogoColumnName(variant);
    await query(
      `UPDATE brands SET ${logoField} = NULL, updated_at = NOW() WHERE project_id = $1`,
      [projectId]
    );

    // TODO: Actually delete the file from Spaces
    // For now, just remove the database reference

    return c.json({ message: 'Logo deleted successfully' });
  } catch (error: any) {
    console.error('Delete logo error:', error);
    return c.json({ error: `Failed to delete logo: ${error.message}` }, 500);
  }
});

// ============= AUTH ROUTES =============

// Initialize user profile
app.post('/auth/initialize', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const user = c.get('user');

    let profile = await kv.get(`user:${userId}:profile`);

    if (!profile) {
      profile = {
        userId,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
        createdAt: new Date().toISOString(),
        settings: {
          notifications: { email: true, push: true, desktop: true },
        },
      };
      await kv.set(`user:${userId}:profile`, profile);
      return c.json({ user: profile });
    }

    return c.json({ user: profile });
  } catch (error: any) {
    console.error('Auth initialize error:', error);
    return c.json({ error: `Initialization failed: ${error.message}` }, 500);
  }
});

// Get user profile
app.get('/auth/profile', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const profile = await kv.get(`user:${userId}:profile`);

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ user: profile });
  } catch (error: any) {
    console.error('Profile error:', error);
    return c.json({ error: `Profile fetch failed: ${error.message}` }, 500);
  }
});

// Import route handlers (to be created)
// import postsRoutes from './routes/posts';
// import projectsRoutes from './routes/projects';
// import templatesRoutes from './routes/templates';
// import automationsRoutes from './routes/automations';
// import connectionsRoutes from './routes/connections';
// import settingsRoutes from './routes/settings';
// import analyticsRoutes from './routes/analytics';
// import trendingRoutes from './routes/trending';
// import oauthRoutes from './routes/oauth';
// import aiRoutes from './routes/ai';
// import ebookRoutes from './routes/ebooks';

// app.route('/posts', postsRoutes);
// app.route('/projects', projectsRoutes);
// app.route('/templates', templatesRoutes);
// app.route('/automations', automationsRoutes);
// app.route('/connections', connectionsRoutes);
// app.route('/settings', settingsRoutes);
// app.route('/analytics', analyticsRoutes);
// app.route('/trending', trendingRoutes);
// app.route('/oauth', oauthRoutes);
// app.route('/ai', aiRoutes);
// app.route('/ebooks', ebookRoutes);

// For now, include basic routes inline until we create separate route files
// This is a simplified version - full routes will be added in subsequent steps

// ============= POSTS ROUTES (Basic) =============

app.get('/posts', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const status = c.req.query('status');
    const platform = c.req.query('platform');
    const projectId = c.req.query('projectId');

    const postIds = projectId
      ? (await kv.get(`project:${projectId}:posts`)) || []
      : (await kv.get(`user:${userId}:posts`)) || [];

    const posts = await Promise.all(
      postIds.map(async (id: string) => await kv.get(`post:${id}`))
    );

    let filteredPosts = posts.filter((p) => p !== null);

    if (status) {
      filteredPosts = filteredPosts.filter((p: any) => p.status === status);
    }

    if (platform && platform !== 'all') {
      filteredPosts = filteredPosts.filter(
        (p: any) => p.platforms && p.platforms.includes(platform)
      );
    }

    return c.json({ posts: filteredPosts });
  } catch (error: any) {
    console.error('Get posts error:', error);
    return c.json({ error: `Failed to fetch posts: ${error.message}` }, 500);
  }
});

app.post('/posts', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const postData = await c.req.json();

    const postId = `${userId}_${Date.now()}_${randomId()}`;
    const post = {
      id: postId,
      userId,
      ...postData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`post:${postId}`, post);

    if (postData.projectId) {
      const projectPostIds = (await kv.get(`project:${postData.projectId}:posts`)) || [];
      projectPostIds.push(postId);
      await kv.set(`project:${postData.projectId}:posts`, projectPostIds);
    } else {
      const postIds = (await kv.get(`user:${userId}:posts`)) || [];
      postIds.push(postId);
      await kv.set(`user:${userId}:posts`, postIds);
    }

    return c.json({ post });
  } catch (error: any) {
    console.error('Create post error:', error);
    return c.json({ error: `Failed to create post: ${error.message}` }, 500);
  }
});

app.get('/posts/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const postId = c.req.param('id');

    const post = await kv.get(`post:${postId}`);

    if (!post || (post as any).userId !== userId) {
      return c.json({ error: 'Post not found' }, 404);
    }

    return c.json({ post });
  } catch (error: any) {
    console.error('Get post error:', error);
    return c.json({ error: `Failed to fetch post: ${error.message}` }, 500);
  }
});

app.put('/posts/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const postId = c.req.param('id');
    const updates = await c.req.json();

    const post = await kv.get(`post:${postId}`);

    if (!post || (post as any).userId !== userId) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const updatedPost = {
      ...post,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`post:${postId}`, updatedPost);

    return c.json({ post: updatedPost });
  } catch (error: any) {
    console.error('Update post error:', error);
    return c.json({ error: `Failed to update post: ${error.message}` }, 500);
  }
});

app.delete('/posts/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const postId = c.req.param('id');

    const post = await kv.get(`post:${postId}`);

    if (!post || (post as any).userId !== userId) {
      return c.json({ error: 'Post not found' }, 404);
    }

    if ((post as any).projectId) {
      const projectPostIds = (await kv.get(`project:${(post as any).projectId}:posts`)) || [];
      const updatedPostIds = projectPostIds.filter((id: string) => id !== postId);
      await kv.set(`project:${(post as any).projectId}:posts`, updatedPostIds);
    } else {
      const postIds = (await kv.get(`user:${userId}:posts`)) || [];
      const updatedPostIds = postIds.filter((id: string) => id !== postId);
      await kv.set(`user:${userId}:posts`, updatedPostIds);
    }

    await kv.del(`post:${postId}`);

    return c.json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('Delete post error:', error);
    return c.json({ error: `Failed to delete post: ${error.message}` }, 500);
  }
});

// ============= PROJECTS ROUTES (Basic) =============

app.get('/projects', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectIds = (await kv.get(`user:${userId}:projects`)) || [];
    const projects = await Promise.all(
      projectIds.map(async (id: string) => await kv.get(`project:${id}`))
    );
    return c.json({ projects: projects.filter((p) => p !== null) });
  } catch (error: any) {
    console.error('Get projects error:', error);
    return c.json({ error: `Failed to fetch projects: ${error.message}` }, 500);
  }
});

app.post('/projects', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { name, description } = await c.req.json();

    const projectId = randomId();
    const project = {
      id: projectId,
      userId,
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
    };

    await kv.set(`project:${projectId}`, project);

    const projectIds = (await kv.get(`user:${userId}:projects`)) || [];
    projectIds.push(projectId);
    await kv.set(`user:${userId}:projects`, projectIds);

    // Initialize empty collections for the new project
    const initialConnections = [
      { platform: 'twitter', connected: false },
      { platform: 'instagram', connected: false },
      { platform: 'linkedin', connected: false },
      { platform: 'facebook', connected: false },
      { platform: 'youtube', connected: false },
      { platform: 'tiktok', connected: false },
      { platform: 'pinterest', connected: false },
      { platform: 'reddit', connected: false },
      { platform: 'blog', connected: false },
    ];
    await kv.set(`project:${projectId}:connections`, initialConnections);
    await kv.set(`project:${projectId}:posts`, []);
    await kv.set(`project:${projectId}:templates`, []);
    await kv.set(`project:${projectId}:automations`, []);

    return c.json({ project });
  } catch (error: any) {
    console.error('Create project error:', error);
    return c.json({ error: `Failed to create project: ${error.message}` }, 500);
  }
});

app.get('/projects/current', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const currentProjectId = await kv.get(`user:${userId}:currentProject`);

    if (!currentProjectId) {
      return c.json({ project: null });
    }

    const project = await kv.get(`project:${currentProjectId}`);
    return c.json({ project });
  } catch (error: any) {
    console.error('Get current project error:', error);
    return c.json({ error: `Failed to fetch current project: ${error.message}` }, 500);
  }
});

app.put('/projects/current', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { projectId } = await c.req.json();

    const project = await kv.get(`project:${projectId}`);
    if (!project || (project as any).userId !== userId) {
      return c.json({ error: 'Project not found' }, 404);
    }

    await kv.set(`user:${userId}:currentProject`, projectId);
    return c.json({ project });
  } catch (error: any) {
    console.error('Set current project error:', error);
    return c.json({ error: `Failed to set current project: ${error.message}` }, 500);
  }
});

app.put('/projects/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');
    const updates = await c.req.json();

    const project = await kv.get(`project:${projectId}`);
    if (!project || (project as any).userId !== userId) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`project:${projectId}`, updatedProject);
    return c.json({ project: updatedProject });
  } catch (error: any) {
    console.error('Update project error:', error);
    return c.json({ error: `Failed to update project: ${error.message}` }, 500);
  }
});

app.delete('/projects/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');

    const project = await kv.get(`project:${projectId}`);
    if (!project || (project as any).userId !== userId) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Switch to another project if this was current
    const currentProjectId = await kv.get(`user:${userId}:currentProject`);
    if (currentProjectId === projectId) {
      const projectIds = (await kv.get(`user:${userId}:projects`)) || [];
      const otherProjectId = projectIds.find((id: string) => id !== projectId);
      if (otherProjectId) {
        await kv.set(`user:${userId}:currentProject`, otherProjectId);
      } else {
        await kv.del(`user:${userId}:currentProject`);
      }
    }

    // Delete all project data
    const postIds = (await kv.get(`project:${projectId}:posts`)) || [];
    for (const postId of postIds) {
      await kv.del(`post:${postId}`);
    }
    await kv.del(`project:${projectId}:posts`);
    await kv.del(`project:${projectId}:connections`);
    await kv.del(`project:${projectId}:templates`);
    await kv.del(`project:${projectId}:automations`);

    // Remove from user's projects
    const projectIds = (await kv.get(`user:${userId}:projects`)) || [];
    const updatedProjectIds = projectIds.filter((id: string) => id !== projectId);
    await kv.set(`user:${userId}:projects`, updatedProjectIds);

    // Delete project
    await kv.del(`project:${projectId}`);

    return c.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Delete project error:', error);
    return c.json({ error: `Failed to delete project: ${error.message}` }, 500);
  }
});

// ============= TEMPLATES ROUTES =============

app.get('/templates', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const templates = (await kv.get(`user:${userId}:templates`)) || [];
    return c.json({ templates });
  } catch (error: any) {
    console.error('Get templates error:', error);
    return c.json({ error: `Failed to fetch templates: ${error.message}` }, 500);
  }
});

app.post('/templates', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const templateData = await c.req.json();

    const templateId = `${userId}_${Date.now()}_${randomId()}`;
    const template = {
      id: templateId,
      userId,
      ...templateData,
      createdAt: new Date().toISOString(),
    };

    const templates = (await kv.get(`user:${userId}:templates`)) || [];
    templates.push(template);
    await kv.set(`user:${userId}:templates`, templates);

    return c.json({ template });
  } catch (error: any) {
    console.error('Create template error:', error);
    return c.json({ error: `Failed to create template: ${error.message}` }, 500);
  }
});

app.delete('/templates/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const templateId = c.req.param('id');

    const templates = (await kv.get(`user:${userId}:templates`)) || [];
    const updatedTemplates = templates.filter((t: any) => t.id !== templateId);
    await kv.set(`user:${userId}:templates`, updatedTemplates);

    return c.json({ message: 'Template deleted successfully' });
  } catch (error: any) {
    console.error('Delete template error:', error);
    return c.json({ error: `Failed to delete template: ${error.message}` }, 500);
  }
});

// ============= AUTOMATIONS ROUTES =============

app.get('/automations', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const automations = (await kv.get(`user:${userId}:automations`)) || [];
    return c.json({ automations });
  } catch (error: any) {
    console.error('Get automations error:', error);
    return c.json({ error: `Failed to fetch automations: ${error.message}` }, 500);
  }
});

app.post('/automations', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const automationData = await c.req.json();

    const automationId = `${userId}_${Date.now()}_${randomId()}`;
    const automation = {
      id: automationId,
      userId,
      ...automationData,
      createdAt: new Date().toISOString(),
    };

    const automations = (await kv.get(`user:${userId}:automations`)) || [];
    automations.push(automation);
    await kv.set(`user:${userId}:automations`, automations);

    return c.json({ automation });
  } catch (error: any) {
    console.error('Create automation error:', error);
    return c.json({ error: `Failed to create automation: ${error.message}` }, 500);
  }
});

app.put('/automations/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const automationId = c.req.param('id');
    const updates = await c.req.json();

    const automations = (await kv.get(`user:${userId}:automations`)) || [];
    const index = automations.findIndex((a: any) => a.id === automationId);

    if (index === -1) {
      return c.json({ error: 'Automation not found' }, 404);
    }

    automations[index] = {
      ...automations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}:automations`, automations);
    return c.json({ automation: automations[index] });
  } catch (error: any) {
    console.error('Update automation error:', error);
    return c.json({ error: `Failed to update automation: ${error.message}` }, 500);
  }
});

app.delete('/automations/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const automationId = c.req.param('id');

    const automations = (await kv.get(`user:${userId}:automations`)) || [];
    const updatedAutomations = automations.filter((a: any) => a.id !== automationId);
    await kv.set(`user:${userId}:automations`, updatedAutomations);

    return c.json({ message: 'Automation deleted successfully' });
  } catch (error: any) {
    console.error('Delete automation error:', error);
    return c.json({ error: `Failed to delete automation: ${error.message}` }, 500);
  }
});

// ============= CONNECTIONS ROUTES =============

app.get('/connections', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.query('projectId');

    if (projectId) {
      const connections = (await kv.get(`project:${projectId}:connections`)) || [];
      return c.json({ connections });
    }

    // Legacy: return user-level connections
    const connections = (await kv.get(`user:${userId}:connections`)) || [];
    return c.json({ connections });
  } catch (error: any) {
    console.error('Get connections error:', error);
    return c.json({ error: `Failed to fetch connections: ${error.message}` }, 500);
  }
});

app.put('/connections', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { connections, projectId } = await c.req.json();

    if (projectId) {
      // Verify project ownership
      const project = await kv.get(`project:${projectId}`);
      if (!project || (project as any).userId !== userId) {
        return c.json({ error: 'Project not found' }, 404);
      }
      await kv.set(`project:${projectId}:connections`, connections);
    } else {
      // Legacy: user-level connections
      await kv.set(`user:${userId}:connections`, connections);
    }

    return c.json({ connections });
  } catch (error: any) {
    console.error('Update connections error:', error);
    return c.json({ error: `Failed to update connections: ${error.message}` }, 500);
  }
});

// ============= SETTINGS ROUTES =============

app.get('/settings', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const settings =
      (await kv.get(`user:${userId}:settings`)) ||
      ({
        theme: 'dark',
        notifications: {
          email: true,
          push: true,
          desktop: true,
        },
      } as any);
    return c.json({ settings });
  } catch (error: any) {
    console.error('Get settings error:', error);
    return c.json({ error: `Failed to fetch settings: ${error.message}` }, 500);
  }
});

app.put('/settings', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const updates = await c.req.json();

    const currentSettings = (await kv.get(`user:${userId}:settings`)) || {};
    const newSettings = { ...currentSettings, ...updates };

    await kv.set(`user:${userId}:settings`, newSettings);
    return c.json({ settings: newSettings });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return c.json({ error: `Failed to update settings: ${error.message}` }, 500);
  }
});

// ============= ANALYTICS ROUTES =============

app.get('/analytics', requireAuth, async (c) => {
  try {
    const platform = c.req.query('platform') || 'all';

    // Return mock analytics data
    // In a real app, this would aggregate data from actual platform APIs
    return c.json({
      analytics: {
        platform,
        overview: {
          totalPosts: 0,
          totalEngagement: 0,
          totalReach: 0,
          totalFollowers: 0,
        },
        engagement: [],
        growth: [],
      },
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    return c.json({ error: `Failed to fetch analytics: ${error.message}` }, 500);
  }
});

// ============= TRENDING ROUTES =============

app.get('/trending', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const platform = c.req.query('platform') || 'all';
    const category = c.req.query('category') || 'general';
    const count = Math.min(parseInt(c.req.query('count') || '25'), 50);
    const projectId = c.req.query('projectId');

    // Validate projectId if provided
    if (projectId) {
      const project = await kv.get(`project:${projectId}`);
      if (!project || (project as any).userId !== userId) {
        return c.json({ error: 'Invalid project ID' }, 403);
      }
    }

    // Generate cache key
    const cacheKey = `trending:${platform}:${category}:${count}`;

    // Check server-side cache (30 minutes TTL)
    const cachedData = await kv.get(cacheKey);
    const now = new Date();

    if (cachedData && cachedData.cached_at) {
      const cacheAge = now.getTime() - new Date(cachedData.cached_at).getTime();
      const THIRTY_MINUTES = 30 * 60 * 1000;

      if (cacheAge < THIRTY_MINUTES) {
        return c.json(cachedData);
      }
    }

    // Fetch fresh data based on platform
    let posts: NormalizedTrendingPost[] = [];

    if (platform === 'reddit' || platform === 'all') {
      try {
        if (category === 'all' || !category) {
          posts = await fetchRedditTrendingAll(count);
        } else {
          posts = await fetchRedditTrending(category, count);
        }
      } catch (error) {
        console.error('Reddit fetch error:', error);
        // If cache exists, return stale cache on error
        if (cachedData) {
          return c.json({
            ...cachedData,
            stale: true,
            error: 'Using cached data due to API error',
          });
        }
        throw error;
      }
    }

    const responseData = {
      posts,
      platform,
      category,
      count: posts.length,
      cached_at: now.toISOString(),
      next_refresh: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
    };

    // Cache the response (30 minutes)
    await kv.set(cacheKey, responseData);

    return c.json(responseData);
  } catch (error: any) {
    console.error('Get trending posts error:', error);
    return c.json(
      {
        error: `Failed to fetch trending posts: ${error.message}`,
        posts: [],
        cached_at: new Date().toISOString(),
        next_refresh: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
      500
    );
  }
});

// ============= AI ROUTES =============

app.post(
  '/ai/generate-text',
  requireAuth,
  userRateLimiter(rateLimitConfigs.ai),
  async (c) => {
    try {
      const { prompt, contextType = 'general', context = '' } = await c.req.json();

      if (!prompt || !prompt.trim()) {
        return c.json({ error: 'Prompt is required' }, 400);
      }

      const systemPrompts: Record<string, string> = {
        reply: `You are a helpful social media assistant writing replies. Generate professional, friendly, and engaging responses that maintain a conversational tone. Keep replies concise and relevant to the context.`,
        post: `You are a creative social media content creator. Generate engaging, platform-appropriate posts with hooks, value, and calls-to-action. Use emojis strategically and keep content concise yet impactful.`,
        comment: `You are a thoughtful community member writing comments. Generate engaging, value-adding comments that contribute to the discussion. Be genuine, helpful, and conversational.`,
        template: `You are a content template creator. Generate versatile, professional templates that are easy to customize. Include placeholders in [brackets] for user customization.`,
        general: `You are a helpful writing assistant. Generate clear, professional, and relevant text based on the user's requirements.`,
      };

      const systemPrompt = systemPrompts[contextType] || systemPrompts.general;
      let userMessage = prompt;
      if (context) {
        userMessage = `Context: ${context}\n\nRequest: ${prompt}`;
      }

      // Call Azure OpenAI
      const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
      const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
      const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION;

      if (!azureEndpoint || !azureApiKey || !azureDeployment || !azureApiVersion) {
        return c.json({ error: 'Azure OpenAI not configured' }, 500);
      }

      const response = await fetch(
        `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': azureApiKey,
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            max_completion_tokens: contextType === 'template' ? 800 : 400,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Azure OpenAI API error: ${error}`);
      }

      const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
      const generatedText = data.choices[0].message.content.trim();

      return c.json({
        success: true,
        text: generatedText,
      });
    } catch (error: any) {
      console.error('AI text generation error:', error);
      return c.json(
        {
          success: false,
          error: `Failed to generate text: ${error.message}`,
        },
        500
      );
    }
  }
);

app.post('/ai/chat', requireAuth, userRateLimiter(rateLimitConfigs.ai), async (c) => {
  try {
    const userId = c.get('userId');
    const { messages, projectId } = await c.req.json();

    // TODO: Implement function calling for AI chat
    // For now, basic chat implementation
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
    const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION;

    if (!azureEndpoint || !azureApiKey || !azureDeployment || !azureApiVersion) {
      return c.json({ error: 'Azure OpenAI not configured' }, 500);
    }

    const systemMessage = {
      role: 'system',
      content: `You are a helpful AI assistant for PubHub, a content repurposing platform. Help users create, manage, and optimize their social media content.`,
    };

    const response = await fetch(
      `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': azureApiKey,
        },
        body: JSON.stringify({
          messages: [systemMessage, ...messages],
          max_completion_tokens: 1000,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI API error: ${error}`);
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
    const assistantMessage = data.choices[0].message.content;

    return c.json({
      message: assistantMessage,
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return c.json({ error: `Failed to process chat: ${error.message}` }, 500);
  }
});

// ============= OAUTH ROUTES =============

app.get('/oauth/authorize/:platform', requireAuth, async (c) => {
  try {
    const platform = c.req.param('platform');
    const userId = c.get('userId');
    const projectId = c.req.query('projectId');

    if (!projectId) {
      return c.json({ error: 'projectId is required' }, 400);
    }

    const config = getOAuthConfig(platform);

    if (!config || !config.clientId) {
      return c.json({
        error: `OAuth not configured for ${platform}. Please add ${platform.toUpperCase()}_CLIENT_ID and ${platform.toUpperCase()}_CLIENT_SECRET environment variables.`,
      }, 400);
    }

    // Generate state for CSRF protection
    const state = `${userId}:${projectId}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

    // Generate PKCE verifier for Twitter OAuth 2.0
    let codeVerifier: string | undefined;
    if (platform === 'twitter') {
      // Generate a random code verifier (43-128 characters)
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      codeVerifier = Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // Store state temporarily for verification (including code_verifier for Twitter)
    await kv.set(`oauth:state:${state}`, {
      userId,
      projectId,
      platform,
      codeVerifier,
      createdAt: Date.now(),
    });

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope,
      state,
    });

    // Platform-specific params - Twitter requires PKCE
    if (platform === 'twitter' && codeVerifier) {
      // Use plain method: code_challenge = code_verifier
      params.set('code_challenge', codeVerifier);
      params.set('code_challenge_method', 'plain');
    }

    const authUrl = `${config.authUrl}?${params.toString()}`;

    return c.json({ authUrl, state });
  } catch (error: any) {
    console.error('OAuth authorize error:', error);
    return c.json({ error: `Authorization failed: ${error.message}` }, 500);
  }
});

app.post('/oauth/callback', requireAuth, async (c) => {
  try {
    const { code, state, platform } = await c.req.json();
    const userId = c.get('userId');

    if (!code || !state || !platform) {
      return c.json({ error: 'Missing required parameters' }, 400);
    }

    // Verify state
    const stateData = await kv.get(`oauth:state:${state}`);

    if (!stateData || (stateData as any).userId !== userId) {
      return c.json({ error: 'Invalid or expired state' }, 400);
    }

    const config = getOAuthConfig(platform);

    if (!config) {
      return c.json({ error: `OAuth not configured for ${platform}` }, 400);
    }

    // Exchange code for access token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId!,
      client_secret: config.clientSecret!,
    });

    // Some platforms need special handling
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // Twitter OAuth 2.0 with PKCE requires Basic Auth and code_verifier
    if (platform === 'twitter') {
      // Twitter requires Basic Authentication header
      const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
      // Remove client credentials from body when using Basic Auth
      tokenParams.delete('client_id');
      tokenParams.delete('client_secret');
      // Add code_verifier for PKCE
      if ((stateData as any).codeVerifier) {
        tokenParams.set('code_verifier', (stateData as any).codeVerifier);
      }
    }

    // Reddit requires Basic Auth
    if (platform === 'reddit') {
      const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
      // Remove from params since we're using Basic Auth
      tokenParams.delete('client_id');
      tokenParams.delete('client_secret');
    }

    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers,
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`Token exchange failed for ${platform}:`, errorText);
      return c.json({ error: `Token exchange failed: ${errorText}` }, 400);
    }

    const tokenData = (await tokenResponse.json()) as { access_token: string; [key: string]: any };

    // Get user info from platform
    let userInfo: any = {};

    try {
      if (platform === 'twitter') {
        const meResponse = await fetch('https://api.twitter.com/2/users/me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const meData = (await meResponse.json()) as { data?: { username?: string; name?: string; id?: string } };
        userInfo = {
          username: meData.data?.username,
          name: meData.data?.name,
          id: meData.data?.id,
        };
      } else if (platform === 'instagram') {
        const meResponse = await fetch(
          `https://graph.instagram.com/me?fields=id,username&access_token=${tokenData.access_token}`
        );
        const meData = (await meResponse.json()) as { username?: string; id?: string };
        userInfo = {
          username: meData.username,
          id: meData.id,
        };
      } else if (platform === 'linkedin') {
        const meResponse = await fetch('https://api.linkedin.com/v2/me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const meData = (await meResponse.json()) as { localizedFirstName?: string; localizedLastName?: string; id?: string };
        userInfo = {
          name: `${meData.localizedFirstName} ${meData.localizedLastName}`,
          id: meData.id,
        };
      } else if (platform === 'facebook') {
        const meResponse = await fetch(
          `https://graph.facebook.com/me?fields=id,name&access_token=${tokenData.access_token}`
        );
        const meData = (await meResponse.json()) as { name?: string; id?: string };
        userInfo = {
          name: meData.name,
          id: meData.id,
        };
      } else if (platform === 'youtube') {
        const meResponse = await fetch(
          'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
          {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          }
        );
        const meData = (await meResponse.json()) as { items?: Array<{ id?: string; snippet?: { title?: string } }> };
        userInfo = {
          username: meData.items?.[0]?.snippet?.title,
          id: meData.items?.[0]?.id,
        };
      } else if (platform === 'reddit') {
        const meResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'User-Agent': 'PubHub/1.0',
          },
        });
        const meData = (await meResponse.json()) as { name?: string; id?: string };
        userInfo = {
          username: meData.name,
          id: meData.id,
        };
      } else if (platform === 'tiktok') {
        const meResponse = await fetch(
          'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name',
          {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          }
        );
        const meData = (await meResponse.json()) as { data?: { user?: { display_name?: string; open_id?: string } } };
        userInfo = {
          username: meData.data?.user?.display_name,
          id: meData.data?.user?.open_id,
        };
      } else if (platform === 'pinterest') {
        const meResponse = await fetch('https://api.pinterest.com/v5/user_account', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const meData = (await meResponse.json()) as { username?: string; id?: string };
        userInfo = {
          username: meData.username,
          id: meData.id,
        };
      }
    } catch (error) {
      console.error(`Failed to fetch user info for ${platform}:`, error);
      // Continue anyway - we have the token
    }

    // Store tokens securely
    const tokenRecord = {
      platform,
      userId,
      projectId: (stateData as any).projectId,
      accessToken: tokenData.access_token,
      refreshToken: (tokenData as any).refresh_token,
      expiresAt: (tokenData as any).expires_in ? Date.now() + (tokenData as any).expires_in * 1000 : null,
      userInfo,
      connectedAt: new Date().toISOString(),
    };

    await kv.set(`oauth:token:${platform}:${(stateData as any).projectId}`, tokenRecord);

    // Initialize default connections if none exist
    const defaultConnections = [
      { platform: 'twitter', connected: false },
      { platform: 'instagram', connected: false },
      { platform: 'linkedin', connected: false },
      { platform: 'facebook', connected: false },
      { platform: 'youtube', connected: false },
      { platform: 'tiktok', connected: false },
      { platform: 'pinterest', connected: false },
      { platform: 'reddit', connected: false },
      { platform: 'blog', connected: false },
    ];

    // Get existing connections or use defaults
    let connections = (await kv.get(`project:${(stateData as any).projectId}:connections`)) || [];

    // If no connections exist, initialize with defaults
    if (!connections || connections.length === 0) {
      connections = defaultConnections;
    }

    // Update or add the platform connection
    let found = false;
    const updatedConnections = connections.map((conn: any) => {
      if (conn.platform === platform) {
        found = true;
        return {
          ...conn,
          connected: true,
          username: userInfo.username || userInfo.name || `Connected Account`,
          accountId: userInfo.id,
          connectedAt: new Date().toISOString(),
        };
      }
      return conn;
    });

    // If platform wasn't found in existing connections, add it
    if (!found) {
      updatedConnections.push({
        platform,
        connected: true,
        username: userInfo.username || userInfo.name || `Connected Account`,
        accountId: userInfo.id,
        connectedAt: new Date().toISOString(),
      });
    }

    await kv.set(`project:${(stateData as any).projectId}:connections`, updatedConnections);

    // Clean up state
    await kv.del(`oauth:state:${state}`);

    return c.json({
      success: true,
      platform,
      username: userInfo.username || userInfo.name,
      connections: updatedConnections,
    });
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return c.json({ error: `Callback failed: ${error.message}` }, 500);
  }
});

app.post('/oauth/disconnect', requireAuth, async (c) => {
  try {
    const { platform, projectId } = await c.req.json();
    const userId = c.get('userId');

    if (!platform || !projectId) {
      return c.json({ error: 'Missing required parameters' }, 400);
    }

    // Delete OAuth tokens
    await kv.del(`oauth:token:${platform}:${projectId}`);

    // Update project connections
    const connections = (await kv.get(`project:${projectId}:connections`)) || [];
    const updatedConnections = connections.map((conn: any) => {
      if (conn.platform === platform) {
        return {
          ...conn,
          connected: false,
          username: undefined,
          accountId: undefined,
          connectedAt: undefined,
        };
      }
      return conn;
    });

    await kv.set(`project:${projectId}:connections`, updatedConnections);

    return c.json({
      success: true,
      connections: updatedConnections,
    });
  } catch (error: any) {
    console.error('OAuth disconnect error:', error);
    return c.json({ error: `Disconnect failed: ${error.message}` }, 500);
  }
});

app.get('/oauth/token/:platform/:projectId', requireAuth, async (c) => {
  try {
    const platform = c.req.param('platform');
    const projectId = c.req.param('projectId');
    const userId = c.get('userId');

    const tokenRecord = await kv.get(`oauth:token:${platform}:${projectId}`);

    if (!tokenRecord || (tokenRecord as any).userId !== userId) {
      return c.json({ error: 'Token not found' }, 404);
    }

    // Check if token expired and needs refresh
    if (
      (tokenRecord as any).expiresAt &&
      Date.now() > (tokenRecord as any).expiresAt &&
      (tokenRecord as any).refreshToken
    ) {
      // Refresh the token
      const config = getOAuthConfig(platform);

      if (config) {
        try {
          const refreshParams = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: (tokenRecord as any).refreshToken,
            client_id: config.clientId!,
            client_secret: config.clientSecret!,
          });

          const refreshResponse = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: refreshParams.toString(),
          });

          if (refreshResponse.ok) {
            const newTokenData = (await refreshResponse.json()) as { access_token: string; refresh_token?: string; expires_in?: number };

            // Update stored token
            const updatedRecord = {
              ...tokenRecord,
              accessToken: newTokenData.access_token,
              refreshToken: newTokenData.refresh_token || (tokenRecord as any).refreshToken,
              expiresAt: newTokenData.expires_in
                ? Date.now() + newTokenData.expires_in * 1000
                : null,
            };

            await kv.set(`oauth:token:${platform}:${projectId}`, updatedRecord);

            return c.json({ accessToken: newTokenData.access_token });
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }
    }

    return c.json({ accessToken: (tokenRecord as any).accessToken });
  } catch (error: any) {
    console.error('Get token error:', error);
    return c.json({ error: `Failed to get token: ${error.message}` }, 500);
  }
});

// ============= PERSONAS ROUTES =============

app.get('/personas/:projectId', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('projectId');

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const personaResult = await query(
      'SELECT * FROM personas WHERE project_id = $1',
      [projectId]
    );

    if (personaResult.rows.length === 0) {
      return c.json({ persona: null });
    }

    return c.json({ persona: personaResult.rows[0] });
  } catch (error: any) {
    console.error('Get persona error:', error);
    return c.json({ error: `Failed to fetch persona: ${error.message}` }, 500);
  }
});

app.post('/personas/:projectId', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('projectId');
    const { persona } = await c.req.json();

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Get user ID from users table
    const userResult = await query('SELECT id FROM users WHERE clerk_user_id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }
    const dbUserId = userResult.rows[0].id;

    const result = await query(
      `INSERT INTO personas (project_id, persona_data, created_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id) 
       DO UPDATE SET persona_data = $2, updated_at = NOW()
       RETURNING *`,
      [projectId, JSON.stringify(persona), dbUserId]
    );

    return c.json({ persona: result.rows[0] });
  } catch (error: any) {
    console.error('Create persona error:', error);
    return c.json({ error: `Failed to create persona: ${error.message}` }, 500);
  }
});

app.put('/personas/:projectId', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('projectId');
    const { updates } = await c.req.json();

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Get existing persona
    const existingResult = await query(
      'SELECT persona_data, version_major, version_minor, version_patch FROM personas WHERE project_id = $1',
      [projectId]
    );

    if (existingResult.rows.length === 0) {
      return c.json({ error: 'Persona not found' }, 404);
    }

    const existing = existingResult.rows[0];
    const updatedPersonaData = {
      ...existing.persona_data,
      ...updates,
    };

    const result = await query(
      `UPDATE personas 
       SET persona_data = $1, version_patch = version_patch + 1, updated_at = NOW()
       WHERE project_id = $2
       RETURNING *`,
      [JSON.stringify(updatedPersonaData), projectId]
    );

    return c.json({ persona: result.rows[0] });
  } catch (error: any) {
    console.error('Update persona error:', error);
    return c.json({ error: `Failed to update persona: ${error.message}` }, 500);
  }
});

app.delete('/personas/:projectId', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('projectId');

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    await query('DELETE FROM personas WHERE project_id = $1', [projectId]);

    return c.json({ message: 'Persona deleted successfully' });
  } catch (error: any) {
    console.error('Delete persona error:', error);
    return c.json({ error: `Failed to delete persona: ${error.message}` }, 500);
  }
});

app.post('/personas/:projectId/generate', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('projectId');
    const { analyze_all = true, max_sources = 50 } = await c.req.json();

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // TODO: This should trigger a background worker job
    // For now, return a job ID that can be polled
    const jobId = randomUUID();
    
    // Store job status in KV for now (will be moved to database)
    await kv.set(`persona:generate:${jobId}`, {
      projectId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return c.json({
      jobId,
      status: 'pending',
      message: 'Persona generation started. Poll /personas/:projectId/generate/:jobId for status.',
    });
  } catch (error: any) {
    console.error('Generate persona error:', error);
    return c.json({ error: `Failed to start persona generation: ${error.message}` }, 500);
  }
});

app.post('/personas/:projectId/bump-version', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('projectId');
    const { type } = await c.req.json();

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    let updateQuery: string;
    if (type === 'major') {
      updateQuery = `UPDATE personas 
                     SET version_major = version_major + 1, 
                         version_minor = 0, 
                         version_patch = 0,
                         updated_at = NOW()
                     WHERE project_id = $1
                     RETURNING *`;
    } else {
      updateQuery = `UPDATE personas 
                     SET version_minor = version_minor + 1, 
                         version_patch = 0,
                         updated_at = NOW()
                     WHERE project_id = $1
                     RETURNING *`;
    }

    const result = await query(updateQuery, [projectId]);

    if (result.rows.length === 0) {
      return c.json({ error: 'Persona not found' }, 404);
    }

    return c.json({ persona: result.rows[0] });
  } catch (error: any) {
    console.error('Bump persona version error:', error);
    return c.json({ error: `Failed to bump version: ${error.message}` }, 500);
  }
});

// ============= CONTENT ROUTES =============

app.get('/content/sources', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.query('projectId');
    const platform = c.req.query('platform');
    const status = c.req.query('status');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    if (!projectId) {
      return c.json({ error: 'projectId is required' }, 400);
    }

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    let queryText = 'SELECT * FROM content_sources WHERE project_id = $1';
    const params: any[] = [projectId];
    let paramIndex = 2;

    if (platform) {
      queryText += ` AND platform = $${paramIndex}`;
      params.push(platform);
      paramIndex++;
    }

    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    queryText += ` ORDER BY ingested_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    return c.json({ sources: result.rows });
  } catch (error: any) {
    console.error('Get content sources error:', error);
    return c.json({ error: `Failed to fetch content sources: ${error.message}` }, 500);
  }
});

app.get('/content/sources/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const result = await query(
      `SELECT cs.* FROM content_sources cs
       JOIN projects p ON p.id = cs.project_id
       JOIN users u ON u.id = p.user_id
       WHERE cs.id = $1 AND u.clerk_user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Content source not found' }, 404);
    }

    return c.json({ source: result.rows[0] });
  } catch (error: any) {
    console.error('Get content source error:', error);
    return c.json({ error: `Failed to fetch content source: ${error.message}` }, 500);
  }
});

app.post('/content/sources', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const sourceData = await c.req.json();

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [sourceData.project_id, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const result = await query(
      `INSERT INTO content_sources (project_id, url, platform, title, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        sourceData.project_id,
        sourceData.url,
        sourceData.platform || 'manual_url',
        sourceData.title || null,
        sourceData.status || 'pending',
        JSON.stringify(sourceData.metadata || {}),
      ]
    );

    return c.json({ source: result.rows[0] });
  } catch (error: any) {
    console.error('Create content source error:', error);
    return c.json({ error: `Failed to create content source: ${error.message}` }, 500);
  }
});

app.post('/content/sources/batch', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { sources } = await c.req.json();

    if (!sources || sources.length === 0) {
      return c.json({ error: 'No sources provided' }, 400);
    }

    // Verify all projects belong to user
    const projectIds = [...new Set(sources.map((s: any) => s.project_id))];
    for (const projectId of projectIds) {
      const projectResult = await query(
        'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
        [projectId, userId]
      );

      if (projectResult.rows.length === 0) {
        return c.json({ error: `Project ${projectId} not found` }, 404);
      }
    }

    const insertedSources = [];
    for (const source of sources) {
      const result = await query(
        `INSERT INTO content_sources (project_id, url, platform, title, status, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          source.project_id,
          source.url,
          source.platform || 'manual_url',
          source.title || null,
          source.status || 'pending',
          JSON.stringify(source.metadata || {}),
        ]
      );
      insertedSources.push(result.rows[0]);
    }

    return c.json({ sources: insertedSources });
  } catch (error: any) {
    console.error('Batch create content sources error:', error);
    return c.json({ error: `Failed to create content sources: ${error.message}` }, 500);
  }
});

app.put('/content/sources/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const updates = await c.req.json();

    // Verify ownership
    const ownershipResult = await query(
      `SELECT cs.id FROM content_sources cs
       JOIN projects p ON p.id = cs.project_id
       JOIN users u ON u.id = p.user_id
       WHERE cs.id = $1 AND u.clerk_user_id = $2`,
      [id, userId]
    );

    if (ownershipResult.rows.length === 0) {
      return c.json({ error: 'Content source not found' }, 404);
    }

    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      params.push(updates.title);
    }
    if (updates.raw_content !== undefined) {
      updateFields.push(`raw_content = $${paramIndex++}`);
      params.push(updates.raw_content);
    }
    if (updates.processed_content !== undefined) {
      updateFields.push(`processed_content = $${paramIndex++}`);
      params.push(updates.processed_content);
    }
    if (updates.content_type !== undefined) {
      updateFields.push(`content_type = $${paramIndex++}`);
      params.push(updates.content_type);
    }
    if (updates.metadata !== undefined) {
      updateFields.push(`metadata = $${paramIndex++}`);
      params.push(JSON.stringify(updates.metadata));
    }

    if (updateFields.length === 0) {
      return c.json({ error: 'No updates provided' }, 400);
    }

    params.push(id);
    const result = await query(
      `UPDATE content_sources SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return c.json({ source: result.rows[0] });
  } catch (error: any) {
    console.error('Update content source error:', error);
    return c.json({ error: `Failed to update content source: ${error.message}` }, 500);
  }
});

app.put('/content/sources/:id/status', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const { status, error_message } = await c.req.json();

    // Verify ownership
    const ownershipResult = await query(
      `SELECT cs.id FROM content_sources cs
       JOIN projects p ON p.id = cs.project_id
       JOIN users u ON u.id = p.user_id
       WHERE cs.id = $1 AND u.clerk_user_id = $2`,
      [id, userId]
    );

    if (ownershipResult.rows.length === 0) {
      return c.json({ error: 'Content source not found' }, 404);
    }

    const updateFields: string[] = ['status = $1'];
    const params: any[] = [status];
    let paramIndex = 2;

    if (error_message !== undefined) {
      updateFields.push(`error_message = $${paramIndex++}`);
      params.push(error_message);
    }

    if (status === 'completed') {
      updateFields.push(`processed_at = NOW()`);
    }

    params.push(id);
    const result = await query(
      `UPDATE content_sources SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return c.json({ source: result.rows[0] });
  } catch (error: any) {
    console.error('Update content source status error:', error);
    return c.json({ error: `Failed to update status: ${error.message}` }, 500);
  }
});

app.delete('/content/sources/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    // Verify ownership
    const ownershipResult = await query(
      `SELECT cs.id FROM content_sources cs
       JOIN projects p ON p.id = cs.project_id
       JOIN users u ON u.id = p.user_id
       WHERE cs.id = $1 AND u.clerk_user_id = $2`,
      [id, userId]
    );

    if (ownershipResult.rows.length === 0) {
      return c.json({ error: 'Content source not found' }, 404);
    }

    await query('DELETE FROM content_sources WHERE id = $1', [id]);

    return c.json({ message: 'Content source deleted successfully' });
  } catch (error: any) {
    console.error('Delete content source error:', error);
    return c.json({ error: `Failed to delete content source: ${error.message}` }, 500);
  }
});

app.post('/content/ingest', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { project_id, urls } = await c.req.json();

    if (!project_id || !urls || urls.length === 0) {
      return c.json({ error: 'project_id and urls are required' }, 400);
    }

    // Validate URLs
    const invalidURLs = urls.filter((url: string) => !isValidURL(url));
    if (invalidURLs.length > 0) {
      return c.json({ error: `Invalid URLs: ${invalidURLs.join(', ')}` }, 400);
    }

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [project_id, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // TODO: This should trigger a background worker job
    // For now, return a job ID that can be polled
    const jobId = randomUUID();
    
    await kv.set(`content:ingest:${jobId}`, {
      project_id,
      urls,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return c.json({
      jobId,
      status: 'pending',
      message: 'Content ingestion started. This will be processed asynchronously.',
    });
  } catch (error: any) {
    console.error('Ingest content error:', error);
    return c.json({ error: `Failed to start ingestion: ${error.message}` }, 500);
  }
});

// ============= RAG ROUTES =============

app.post('/rag/query', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const {
      query: queryText,
      project_id,
      top_k = 5,
      similarity_threshold = 0.7,
      filters = {},
      use_persona = true,
    } = await c.req.json();

    if (!queryText || !project_id) {
      return c.json({ error: 'query and project_id are required' }, 400);
    }

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [project_id, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Get Azure OpenAI credentials
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
    const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION;

    if (!azureEndpoint || !azureApiKey || !azureDeployment || !azureApiVersion) {
      return c.json({ error: 'Azure OpenAI not configured' }, 500);
    }

    // Generate embedding for the query
    const embeddingUrl = `${azureEndpoint}/openai/deployments/${azureDeployment}/embeddings?api-version=${azureApiVersion}`;
    const embeddingResponse = await fetch(embeddingUrl, {
      method: 'POST',
      headers: {
        'api-key': azureApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: queryText,
        dimensions: 512,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      throw new Error(`Azure OpenAI Embeddings API error: ${errorText}`);
    }

    const embeddingData = (await embeddingResponse.json()) as { data: Array<{ embedding: number[] }> };
    const queryEmbedding = embeddingData.data[0].embedding;

    // Perform vector similarity search
    // Convert embedding array to PostgreSQL vector format: '[0.1,0.2,...]'
    const embeddingVector = '[' + queryEmbedding.join(',') + ']';
    
    let similarChunks: any[] = [];
    try {
      // Try using the match_persona_vectors function if it exists
      // Function signature: match_persona_vectors(query_embedding, filter_project_id, match_threshold, match_count)
      const searchResult = await query(
        `SELECT * FROM match_persona_vectors(
          $1::vector,
          $2::uuid,
          $3::float,
          $4::int
        )`,
        [embeddingVector, project_id, similarity_threshold, top_k]
      );

      similarChunks = searchResult.rows || [];
    } catch (error: any) {
      console.error('Vector search function error, trying direct query:', error);
      // Fallback to direct vector search
      try {
        const params: any[] = [embeddingVector, project_id];
        let queryText = `SELECT pv.*, cs.title, cs.url,
           1 - (pv.embedding <=> $1::vector) as similarity
           FROM persona_vectors pv
           JOIN content_sources cs ON cs.id = pv.content_source_id
           WHERE pv.project_id = $2`;
        
        if (filters.platform) {
          queryText += ' AND cs.platform = $3';
          params.push(filters.platform);
        }
        
        queryText += ` ORDER BY pv.embedding <=> $1::vector LIMIT $${params.length + 1}`;
        params.push(top_k);

        const searchResult = await query(queryText, params);

        similarChunks = searchResult.rows.filter(
          (row: any) => row.similarity >= similarity_threshold
        );
      } catch (fallbackError: any) {
        console.error('Direct vector search error:', fallbackError);
        // Final fallback to basic search without vector similarity
        const params: any[] = [project_id];
        let queryText = `SELECT pv.*, cs.title, cs.url, 0.8 as similarity
           FROM persona_vectors pv
           JOIN content_sources cs ON cs.id = pv.content_source_id
           WHERE pv.project_id = $1`;
        
        if (filters.platform) {
          queryText += ' AND cs.platform = $2';
          params.push(filters.platform);
        }
        
        queryText += ` LIMIT $${params.length + 1}`;
        params.push(top_k);
        
        const fallbackResult = await query(queryText, params);
        similarChunks = fallbackResult.rows;
      }
    }

    if (similarChunks.length === 0) {
      return c.json({
        answer: "I don't have enough information to answer that question based on your content.",
        sources: [],
        persona_used: false,
        confidence: 0,
      });
    }

    // Fetch persona if requested
    let personaContext = '';
    let personaUsed = false;

    if (use_persona) {
      const personaResult = await query(
        'SELECT persona_data FROM personas WHERE project_id = $1',
        [project_id]
      );

      if (personaResult.rows.length > 0) {
        const persona = personaResult.rows[0].persona_data;
        personaUsed = true;
        personaContext = `
Creator Persona Context:
- Name: ${persona.identity?.display_name || 'Unknown'}
- Bio: ${persona.identity?.bio_summary || ''}
- Expertise: ${persona.identity?.expertise_domains?.join(', ') || ''}
- Voice Tone: ${JSON.stringify(persona.voice?.tone_axes || {})}
- Signature Phrases: ${persona.voice?.lexical_preferences?.signature_phrases?.join(', ') || ''}
- Primary Topics: ${persona.topics?.primary_topics?.join(', ') || ''}
`;
      }
    }

    // Build context from retrieved chunks
    const contextChunks = similarChunks
      .map((chunk: any, idx: number) => `[${idx + 1}] ${chunk.chunk_text}`)
      .join('\n\n');

    // Generate answer using GPT-4o-mini
    const systemPrompt = personaUsed
      ? `You are an AI assistant helping answer questions based on the creator's own content.
${personaContext}

Answer questions in a style that matches the creator's voice and expertise.
Use the provided context chunks to support your answer.
If the context doesn't contain relevant information, say so.`
      : `You are an AI assistant helping answer questions based on the provided context.
Use the context chunks to support your answer.
If the context doesn't contain relevant information, say so.`;

    const userPrompt = `Context from creator's content:
${contextChunks}

Question: ${queryText}

Provide a comprehensive answer based on the context above.`;

    const chatUrl = `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`;
    const chatResponse = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'api-key': azureApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      throw new Error(`Azure OpenAI Chat API error: ${errorText}`);
    }

    const chatData = (await chatResponse.json()) as { choices: Array<{ message: { content: string } }> };
    const answer = chatData.choices[0].message.content;

    // Calculate confidence based on similarity scores
    const avgSimilarity =
      similarChunks.reduce((sum: number, chunk: any) => sum + (chunk.similarity || 0), 0) /
      similarChunks.length;
    const confidence = Math.min(avgSimilarity * 1.2, 1.0);

    // Prepare sources
    const sources = similarChunks.map((chunk: any) => ({
      content_source_id: chunk.content_source_id,
      chunk_text: chunk.chunk_text.substring(0, 200) + '...',
      similarity: chunk.similarity || 0,
      metadata: chunk.metadata || {},
    }));

    return c.json({
      answer,
      sources,
      persona_used: personaUsed,
      confidence,
    });
  } catch (error: any) {
    console.error('RAG query error:', error);
    return c.json({ error: `Failed to process RAG query: ${error.message}` }, 500);
  }
});

// ============= BRANDS ROUTES =============

app.get('/brands/:projectId', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('projectId');

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const brandResult = await query('SELECT * FROM brands WHERE project_id = $1', [projectId]);

    if (brandResult.rows.length === 0) {
      return c.json({ brand: null });
    }

    return c.json({ brand: brandResult.rows[0] });
  } catch (error: any) {
    console.error('Get brand error:', error);
    return c.json({ error: `Failed to fetch brand: ${error.message}` }, 500);
  }
});

app.post('/brands', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const brandData = await c.req.json();

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [brandData.project_id, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const result = await query(
      `INSERT INTO brands (project_id, primary_color, secondary_color, accent_color, palette_keywords,
                          logo_light_url, logo_dark_url, logo_square_url, logo_keywords,
                          primary_font, secondary_font, pillars, values, positioning_statement, taglines)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (project_id)
       DO UPDATE SET
         primary_color = EXCLUDED.primary_color,
         secondary_color = EXCLUDED.secondary_color,
         accent_color = EXCLUDED.accent_color,
         palette_keywords = EXCLUDED.palette_keywords,
         logo_light_url = EXCLUDED.logo_light_url,
         logo_dark_url = EXCLUDED.logo_dark_url,
         logo_square_url = EXCLUDED.logo_square_url,
         logo_keywords = EXCLUDED.logo_keywords,
         primary_font = EXCLUDED.primary_font,
         secondary_font = EXCLUDED.secondary_font,
         pillars = EXCLUDED.pillars,
         values = EXCLUDED.values,
         positioning_statement = EXCLUDED.positioning_statement,
         taglines = EXCLUDED.taglines,
         updated_at = NOW()
       RETURNING *`,
      [
        brandData.project_id,
        brandData.primary_color || null,
        brandData.secondary_color || null,
        brandData.accent_color || null,
        brandData.palette_keywords || null,
        brandData.logo_light_url || null,
        brandData.logo_dark_url || null,
        brandData.logo_square_url || null,
        brandData.logo_keywords || null,
        brandData.primary_font || null,
        brandData.secondary_font || null,
        brandData.pillars || null,
        brandData.values || null,
        brandData.positioning_statement || null,
        brandData.taglines || null,
      ]
    );

    return c.json({ brand: result.rows[0] });
  } catch (error: any) {
    console.error('Create brand error:', error);
    return c.json({ error: `Failed to create brand: ${error.message}` }, 500);
  }
});

app.put('/brands/:projectId', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('projectId');
    const updates = await c.req.json();

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fields = [
      'primary_color',
      'secondary_color',
      'accent_color',
      'palette_keywords',
      'logo_light_url',
      'logo_dark_url',
      'logo_square_url',
      'logo_keywords',
      'primary_font',
      'secondary_font',
      'pillars',
      'values',
      'positioning_statement',
      'taglines',
    ];

    for (const field of fields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex++}`);
        params.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return c.json({ error: 'No updates provided' }, 400);
    }

    updateFields.push('updated_at = NOW()');
    params.push(projectId);

    const result = await query(
      `UPDATE brands SET ${updateFields.join(', ')} WHERE project_id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Brand not found' }, 404);
    }

    return c.json({ brand: result.rows[0] });
  } catch (error: any) {
    console.error('Update brand error:', error);
    return c.json({ error: `Failed to update brand: ${error.message}` }, 500);
  }
});

app.delete('/brands/:projectId', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('projectId');

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    await query('DELETE FROM brands WHERE project_id = $1', [projectId]);

    return c.json({ message: 'Brand deleted successfully' });
  } catch (error: any) {
    console.error('Delete brand error:', error);
    return c.json({ error: `Failed to delete brand: ${error.message}` }, 500);
  }
});

// ============= POST PUBLISHING =============

app.post(
  '/posts/publish',
  requireAuth,
  userRateLimiter(rateLimitConfigs.publishing),
  async (c) => {
    try {
      const userId = c.get('userId');
      const { postId, platforms, projectId, content, media } = await c.req.json();

      if (!platforms || platforms.length === 0) {
        return c.json({ error: 'No platforms specified' }, 400);
      }

      // TODO: Implement platform-specific publishing
      // For now, return success for all platforms
      const results = platforms.map((platform: string) => ({
        platform,
        success: true,
        message: 'Published successfully (mock)',
      }));

      // Update post status
      if (postId) {
        const post = await kv.get(`post:${postId}`);
        if (post) {
          const updatedPost = {
            ...post,
            publishedPlatforms: platforms,
            publishStatus: results,
            lastPublished: new Date().toISOString(),
            status: 'published',
          };
          await kv.set(`post:${postId}`, updatedPost);
        }
      }

      return c.json({
        success: true,
        results,
        summary: {
          total: platforms.length,
          successful: results.filter((r: any) => r.success).length,
          failed: results.filter((r: any) => !r.success).length,
        },
      });
    } catch (error: any) {
      console.error('Publish error:', error);
      return c.json({ error: `Failed to publish: ${error.message}` }, 500);
    }
  }
);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database pool...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database pool...');
  await closePool();
  process.exit(0);
});

const port = parseInt(process.env.PORT || '8080', 10);

// For Node.js, we need to create an HTTP server
// Hono's app.fetch works with Node.js 18+ fetch API
import { serve } from '@hono/node-server';

// Start the server
serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`API server ready on port ${info.port}`);
  }
);

