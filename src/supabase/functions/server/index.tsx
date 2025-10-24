import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Supabase admin client for database access and auth verification
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Auth middleware for Supabase
async function requireAuth(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Unauthorized - No authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Verify Supabase token
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !user) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
  
  // Set user info from Supabase token
  c.set('userId', user.id);
  c.set('user', user);
  await next();
}

// Health check endpoint
app.get("/make-server-19ccd85e/health", (c) => {
  return c.json({ status: "ok" });
});

// ============= AUTH ROUTES =============

// Initialize user on first login (called automatically after sign up/in)
app.post("/make-server-19ccd85e/auth/initialize", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const user = c.get('user');
    
    // Check if user already initialized
    const existingProfile = await kv.get(`user:${userId}:profile`);
    if (existingProfile) {
      return c.json({ 
        user: existingProfile,
        message: 'User already initialized'
      });
    }

    // Initialize user data in KV store
    await kv.set(`user:${userId}:profile`, {
      id: userId,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      createdAt: new Date().toISOString(),
    });

    // Create default project
    const defaultProjectId = `${userId}_${Date.now()}_default`;
    const defaultProject = {
      id: defaultProjectId,
      userId: userId,
      name: 'My First Project',
      description: 'Your default workspace',
      createdAt: new Date().toISOString(),
      isDefault: true,
    };
    
    await kv.set(`project:${defaultProjectId}`, defaultProject);
    await kv.set(`user:${userId}:projects`, [defaultProjectId]);
    await kv.set(`user:${userId}:currentProject`, defaultProjectId);

    // Initialize empty collections (legacy, for backwards compatibility)
    await kv.set(`user:${userId}:posts`, []);
    await kv.set(`user:${userId}:templates`, []);
    await kv.set(`user:${userId}:automations`, []);
    await kv.set(`user:${userId}:connections`, []);
    await kv.set(`user:${userId}:settings`, {
      theme: 'dark',
      notifications: {
        email: true,
        push: true,
        desktop: true,
      },
    });

    return c.json({ 
      user: await kv.get(`user:${userId}:profile`),
      message: 'User initialized successfully'
    });
  } catch (error: any) {
    console.error('User initialization error:', error);
    return c.json({ error: `Initialization failed: ${error.message}` }, 500);
  }
});

// Get user profile
app.get("/make-server-19ccd85e/auth/profile", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    
    // Get user profile from KV
    const profile = await kv.get(`user:${userId}:profile`);
    
    // Auto-initialize if profile doesn't exist
    if (!profile) {
      const user = c.get('user');
      const newProfile = {
        id: userId,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        createdAt: new Date().toISOString(),
      };
      await kv.set(`user:${userId}:profile`, newProfile);
      
      // Create default project
      const defaultProjectId = `${userId}_${Date.now()}_default`;
      const defaultProject = {
        id: defaultProjectId,
        userId: userId,
        name: 'My First Project',
        description: 'Your default workspace',
        createdAt: new Date().toISOString(),
        isDefault: true,
      };
      
      await kv.set(`project:${defaultProjectId}`, defaultProject);
      await kv.set(`user:${userId}:projects`, [defaultProjectId]);
      await kv.set(`user:${userId}:currentProject`, defaultProjectId);
      await kv.set(`user:${userId}:posts`, []);
      await kv.set(`user:${userId}:templates`, []);
      await kv.set(`user:${userId}:automations`, []);
      await kv.set(`user:${userId}:connections`, []);
      await kv.set(`user:${userId}:settings`, {
        theme: 'dark',
        notifications: { email: true, push: true, desktop: true },
      });
      
      return c.json({ user: newProfile });
    }
    
    return c.json({ user: profile });
  } catch (error: any) {
    console.error('Profile error:', error);
    return c.json({ error: `Profile fetch failed: ${error.message}` }, 500);
  }
});

// ============= POST ROUTES =============

// Get all posts
app.get("/make-server-19ccd85e/posts", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const status = c.req.query('status'); // draft, scheduled, published
    const platform = c.req.query('platform');
    const projectId = c.req.query('projectId');
    
    // Use project-specific posts if projectId provided, otherwise legacy user posts
    const postIds = projectId 
      ? await kv.get(`project:${projectId}:posts`) || []
      : await kv.get(`user:${userId}:posts`) || [];
    
    const posts = await Promise.all(
      postIds.map(async (id: string) => await kv.get(`post:${id}`))
    );
    
    let filteredPosts = posts.filter(p => p !== null);
    
    if (status) {
      filteredPosts = filteredPosts.filter(p => p.status === status);
    }
    
    if (platform && platform !== 'all') {
      filteredPosts = filteredPosts.filter(p => 
        p.platforms && p.platforms.includes(platform)
      );
    }
    
    return c.json({ posts: filteredPosts });
  } catch (error: any) {
    console.error('Get posts error:', error);
    return c.json({ error: `Failed to fetch posts: ${error.message}` }, 500);
  }
});

// Create post
app.post("/make-server-19ccd85e/posts", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const postData = await c.req.json();
    
    const postId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const post = {
      id: postId,
      userId,
      ...postData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Save post
    await kv.set(`post:${postId}`, post);
    
    // Add to project's posts if projectId provided, otherwise legacy user posts
    if (postData.projectId) {
      const projectPostIds = await kv.get(`project:${postData.projectId}:posts`) || [];
      projectPostIds.push(postId);
      await kv.set(`project:${postData.projectId}:posts`, projectPostIds);
    } else {
      const postIds = await kv.get(`user:${userId}:posts`) || [];
      postIds.push(postId);
      await kv.set(`user:${userId}:posts`, postIds);
    }
    
    return c.json({ post });
  } catch (error: any) {
    console.error('Create post error:', error);
    return c.json({ error: `Failed to create post: ${error.message}` }, 500);
  }
});

// Get single post
app.get("/make-server-19ccd85e/posts/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const postId = c.req.param('id');
    
    const post = await kv.get(`post:${postId}`);
    
    if (!post || post.userId !== userId) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    return c.json({ post });
  } catch (error: any) {
    console.error('Get post error:', error);
    return c.json({ error: `Failed to fetch post: ${error.message}` }, 500);
  }
});

// Update post
app.put("/make-server-19ccd85e/posts/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const postId = c.req.param('id');
    const updates = await c.req.json();
    
    const post = await kv.get(`post:${postId}`);
    
    if (!post || post.userId !== userId) {
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

// Delete post
app.delete("/make-server-19ccd85e/posts/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const postId = c.req.param('id');
    
    const post = await kv.get(`post:${postId}`);
    
    if (!post || post.userId !== userId) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    // Remove from project's posts if projectId exists, otherwise legacy user posts
    if (post.projectId) {
      const projectPostIds = await kv.get(`project:${post.projectId}:posts`) || [];
      const updatedPostIds = projectPostIds.filter((id: string) => id !== postId);
      await kv.set(`project:${post.projectId}:posts`, updatedPostIds);
    } else {
      const postIds = await kv.get(`user:${userId}:posts`) || [];
      const updatedPostIds = postIds.filter((id: string) => id !== postId);
      await kv.set(`user:${userId}:posts`, updatedPostIds);
    }
    
    // Delete post
    await kv.del(`post:${postId}`);
    
    return c.json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('Delete post error:', error);
    return c.json({ error: `Failed to delete post: ${error.message}` }, 500);
  }
});

// ============= TEMPLATE ROUTES =============

// Get templates
app.get("/make-server-19ccd85e/templates", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const templates = await kv.get(`user:${userId}:templates`) || [];
    return c.json({ templates });
  } catch (error: any) {
    console.error('Get templates error:', error);
    return c.json({ error: `Failed to fetch templates: ${error.message}` }, 500);
  }
});

// Create template
app.post("/make-server-19ccd85e/templates", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const templateData = await c.req.json();
    
    const templateId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const template = {
      id: templateId,
      userId,
      ...templateData,
      createdAt: new Date().toISOString(),
    };
    
    const templates = await kv.get(`user:${userId}:templates`) || [];
    templates.push(template);
    await kv.set(`user:${userId}:templates`, templates);
    
    return c.json({ template });
  } catch (error: any) {
    console.error('Create template error:', error);
    return c.json({ error: `Failed to create template: ${error.message}` }, 500);
  }
});

// Delete template
app.delete("/make-server-19ccd85e/templates/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const templateId = c.req.param('id');
    
    const templates = await kv.get(`user:${userId}:templates`) || [];
    const updatedTemplates = templates.filter((t: any) => t.id !== templateId);
    await kv.set(`user:${userId}:templates`, updatedTemplates);
    
    return c.json({ message: 'Template deleted successfully' });
  } catch (error: any) {
    console.error('Delete template error:', error);
    return c.json({ error: `Failed to delete template: ${error.message}` }, 500);
  }
});

// ============= AUTOMATION ROUTES =============

// Get automations
app.get("/make-server-19ccd85e/automations", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const automations = await kv.get(`user:${userId}:automations`) || [];
    return c.json({ automations });
  } catch (error: any) {
    console.error('Get automations error:', error);
    return c.json({ error: `Failed to fetch automations: ${error.message}` }, 500);
  }
});

// Create automation
app.post("/make-server-19ccd85e/automations", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const automationData = await c.req.json();
    
    const automationId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const automation = {
      id: automationId,
      userId,
      ...automationData,
      createdAt: new Date().toISOString(),
    };
    
    const automations = await kv.get(`user:${userId}:automations`) || [];
    automations.push(automation);
    await kv.set(`user:${userId}:automations`, automations);
    
    return c.json({ automation });
  } catch (error: any) {
    console.error('Create automation error:', error);
    return c.json({ error: `Failed to create automation: ${error.message}` }, 500);
  }
});

// Update automation
app.put("/make-server-19ccd85e/automations/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const automationId = c.req.param('id');
    const updates = await c.req.json();
    
    const automations = await kv.get(`user:${userId}:automations`) || [];
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

// Delete automation
app.delete("/make-server-19ccd85e/automations/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const automationId = c.req.param('id');
    
    const automations = await kv.get(`user:${userId}:automations`) || [];
    const updatedAutomations = automations.filter((a: any) => a.id !== automationId);
    await kv.set(`user:${userId}:automations`, updatedAutomations);
    
    return c.json({ message: 'Automation deleted successfully' });
  } catch (error: any) {
    console.error('Delete automation error:', error);
    return c.json({ error: `Failed to delete automation: ${error.message}` }, 500);
  }
});

// ============= CONNECTION ROUTES =============

// Get connections
app.get("/make-server-19ccd85e/connections", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.query('projectId');
    
    // Use project-specific connections if projectId provided, otherwise legacy user connections
    const connections = projectId
      ? await kv.get(`project:${projectId}:connections`) || []
      : await kv.get(`user:${userId}:connections`) || [];
    
    return c.json({ connections });
  } catch (error: any) {
    console.error('Get connections error:', error);
    return c.json({ error: `Failed to fetch connections: ${error.message}` }, 500);
  }
});

// Update connections
app.put("/make-server-19ccd85e/connections", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { connections, projectId } = await c.req.json();
    
    // Validate that accounts aren't already connected to other projects
    if (projectId) {
      // Get all user's projects
      const projectIds = await kv.get(`user:${userId}:projects`) || [];
      
      // Check each connection against all other projects
      for (const conn of connections) {
        if (conn.connected && conn.accountId) {
          for (const projId of projectIds) {
            if (projId !== projectId) {
              const existingConns = await kv.get(`project:${projId}:connections`) || [];
              const duplicate = existingConns.find((ec: any) => 
                ec.platform === conn.platform && 
                ec.accountId === conn.accountId && 
                ec.connected
              );
              
              if (duplicate) {
                const otherProject = await kv.get(`project:${projId}`);
                return c.json({ 
                  error: `This ${conn.platform} account is already connected to project "${otherProject?.name || 'another project'}". Each account can only be linked to one project.` 
                }, 400);
              }
            }
          }
        }
      }
    }
    
    // Save connections to project or legacy user connections
    if (projectId) {
      await kv.set(`project:${projectId}:connections`, connections);
    } else {
      await kv.set(`user:${userId}:connections`, connections);
    }
    
    return c.json({ connections });
  } catch (error: any) {
    console.error('Update connections error:', error);
    return c.json({ error: `Failed to update connections: ${error.message}` }, 500);
  }
});

// ============= SETTINGS ROUTES =============

// Get settings
app.get("/make-server-19ccd85e/settings", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const settings = await kv.get(`user:${userId}:settings`) || {
      theme: 'dark',
      notifications: {
        email: true,
        push: true,
        desktop: true,
      },
    };
    return c.json({ settings });
  } catch (error: any) {
    console.error('Get settings error:', error);
    return c.json({ error: `Failed to fetch settings: ${error.message}` }, 500);
  }
});

// Update settings
app.put("/make-server-19ccd85e/settings", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const updates = await c.req.json();
    
    const currentSettings = await kv.get(`user:${userId}:settings`) || {};
    const newSettings = { ...currentSettings, ...updates };
    
    await kv.set(`user:${userId}:settings`, newSettings);
    
    return c.json({ settings: newSettings });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return c.json({ error: `Failed to update settings: ${error.message}` }, 500);
  }
});

// ============= PROJECT ROUTES =============

// Get all projects for user
app.get("/make-server-19ccd85e/projects", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectIds = await kv.get(`user:${userId}:projects`) || [];
    
    const projects = await Promise.all(
      projectIds.map(async (id: string) => await kv.get(`project:${id}`))
    );
    
    const filteredProjects = projects.filter(p => p !== null);
    
    return c.json({ projects: filteredProjects });
  } catch (error: any) {
    console.error('Get projects error:', error);
    return c.json({ error: `Failed to fetch projects: ${error.message}` }, 500);
  }
});

// Get current project
app.get("/make-server-19ccd85e/projects/current", requireAuth, async (c) => {
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

// Set current project
app.put("/make-server-19ccd85e/projects/current", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { projectId } = await c.req.json();
    
    // Verify project belongs to user
    const project = await kv.get(`project:${projectId}`);
    if (!project || project.userId !== userId) {
      return c.json({ error: 'Project not found' }, 404);
    }
    
    await kv.set(`user:${userId}:currentProject`, projectId);
    
    return c.json({ project });
  } catch (error: any) {
    console.error('Set current project error:', error);
    return c.json({ error: `Failed to set current project: ${error.message}` }, 500);
  }
});

// Create project
app.post("/make-server-19ccd85e/projects", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { name, description } = await c.req.json();
    
    const projectId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const project = {
      id: projectId,
      userId,
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
      isDefault: false,
    };
    
    await kv.set(`project:${projectId}`, project);
    
    const projectIds = await kv.get(`user:${userId}:projects`) || [];
    projectIds.push(projectId);
    await kv.set(`user:${userId}:projects`, projectIds);
    
    return c.json({ project });
  } catch (error: any) {
    console.error('Create project error:', error);
    return c.json({ error: `Failed to create project: ${error.message}` }, 500);
  }
});

// Update project
app.put("/make-server-19ccd85e/projects/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');
    const updates = await c.req.json();
    
    const project = await kv.get(`project:${projectId}`);
    
    if (!project || project.userId !== userId) {
      return c.json({ error: 'Project not found' }, 404);
    }
    
    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString(),
      // Prevent changing immutable fields
      id: project.id,
      userId: project.userId,
      createdAt: project.createdAt,
    };
    
    await kv.set(`project:${projectId}`, updatedProject);
    
    return c.json({ project: updatedProject });
  } catch (error: any) {
    console.error('Update project error:', error);
    return c.json({ error: `Failed to update project: ${error.message}` }, 500);
  }
});

// Delete project
app.delete("/make-server-19ccd85e/projects/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');
    
    const project = await kv.get(`project:${projectId}`);
    
    if (!project || project.userId !== userId) {
      return c.json({ error: 'Project not found' }, 404);
    }
    
    // Prevent deleting default project
    if (project.isDefault) {
      return c.json({ error: 'Cannot delete default project' }, 400);
    }
    
    // Check if this is the current project
    const currentProjectId = await kv.get(`user:${userId}:currentProject`);
    if (currentProjectId === projectId) {
      // Find another project to set as current
      const projectIds = await kv.get(`user:${userId}:projects`) || [];
      const otherProjectId = projectIds.find((id: string) => id !== projectId);
      if (otherProjectId) {
        await kv.set(`user:${userId}:currentProject`, otherProjectId);
      }
    }
    
    // Delete all project data
    const postIds = await kv.get(`project:${projectId}:posts`) || [];
    for (const postId of postIds) {
      await kv.del(`post:${postId}`);
    }
    await kv.del(`project:${projectId}:posts`);
    await kv.del(`project:${projectId}:connections`);
    
    // Remove from user's projects
    const projectIds = await kv.get(`user:${userId}:projects`) || [];
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

// ============= ANALYTICS ROUTES =============

// Get analytics (mock data for now)
app.get("/make-server-19ccd85e/analytics", requireAuth, async (c) => {
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
      }
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    return c.json({ error: `Failed to fetch analytics: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);
