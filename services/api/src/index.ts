import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { requireAuth } from './middleware/auth';
import { rateLimiter, userRateLimiter, rateLimitConfigs } from './middleware/rate-limit';
import * as kv from './db/kv-store';
import { initializeBucket, uploadFile, getSignedUrlForFile } from './storage/spaces';
import { closePool } from './db/client';

// Helper to generate random IDs
function randomId(): string {
  // Use crypto.randomUUID if available (Node.js 16+)
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  // Fallback for older Node.js versions
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const app = new Hono();

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
      const project = await kv.get(`project:${projectId}`);
      if (!project || project.userId !== userId) {
        return c.json({ error: 'Project not found or access denied' }, 404);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `project-logos/${projectId}.${fileExt}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { url } = await uploadFile(fileName, buffer, file.type, { public: false });
      const signedUrl = await getSignedUrlForFile(fileName, 31536000);

      // Update project
      project.logoUrl = signedUrl;
      project.logoPath = fileName;
      await kv.set(`project:${projectId}`, project);

      return c.json({ url: signedUrl, path: fileName });
    } catch (error: any) {
      console.error('Project logo upload error:', error);
      return c.json({ error: `Upload failed: ${error.message}` }, 500);
    }
  }
);

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

    // TODO: Implement trending post fetching
    // For now, return empty array
    const posts: any[] = [];

    const responseData = {
      posts,
      platform,
      category,
      count: posts.length,
      cached_at: now.toISOString(),
      next_refresh: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
    };

    // Cache the response
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

      const data = await response.json();
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

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return c.json({
      message: assistantMessage,
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return c.json({ error: `Failed to process chat: ${error.message}` }, 500);
  }
});

// ============= OAUTH ROUTES (Basic - to be expanded) =============

app.get('/oauth/authorize/:platform', requireAuth, async (c) => {
  try {
    const platform = c.req.param('platform');
    const userId = c.get('userId');
    const projectId = c.req.query('projectId');

    if (!projectId) {
      return c.json({ error: 'projectId is required' }, 400);
    }

    // TODO: Implement full OAuth flow
    // This is a placeholder - full implementation requires OAuth config
    return c.json({
      error: 'OAuth not fully implemented yet. Please configure OAuth credentials.',
    });
  } catch (error: any) {
    console.error('OAuth authorize error:', error);
    return c.json({ error: `Authorization failed: ${error.message}` }, 500);
  }
});

app.post('/oauth/callback', requireAuth, async (c) => {
  try {
    const { code, state, platform } = await c.req.json();
    // TODO: Implement OAuth callback
    return c.json({ error: 'OAuth callback not fully implemented yet' });
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

    // TODO: Check expiration and refresh if needed
    return c.json({ accessToken: (tokenRecord as any).accessToken });
  } catch (error: any) {
    console.error('Get token error:', error);
    return c.json({ error: `Failed to get token: ${error.message}` }, 500);
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

// Export for DigitalOcean App Platform
export default {
  port,
  fetch: app.fetch,
};

// For local development with Node.js
// DigitalOcean App Platform will use the exported fetch handler
if (import.meta.url === `file://${process.argv[1]}` || process.env.NODE_ENV === 'development') {
  // Use a simple HTTP server for local development
  const server = { port, fetch: app.fetch };
  console.log(`API server ready on port ${port}`);
}

