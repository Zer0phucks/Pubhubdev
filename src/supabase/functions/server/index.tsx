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

    // Initialize empty platform connections for the default project
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
    await kv.set(`project:${defaultProjectId}:connections`, initialConnections);
    await kv.set(`project:${defaultProjectId}:posts`, []);
    await kv.set(`project:${defaultProjectId}:templates`, []);
    await kv.set(`project:${defaultProjectId}:automations`, []);

    // Initialize empty collections (legacy, for backwards compatibility)
    await kv.set(`user:${userId}:posts`, []);
    await kv.set(`user:${userId}:templates`, []);
    await kv.set(`user:${userId}:automations`, []);
    await kv.set(`user:${userId}:connections`, initialConnections);
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
      
      // Initialize empty platform connections for the default project
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
      await kv.set(`project:${defaultProjectId}:connections`, initialConnections);
      await kv.set(`project:${defaultProjectId}:posts`, []);
      await kv.set(`project:${defaultProjectId}:templates`, []);
      await kv.set(`project:${defaultProjectId}:automations`, []);
      
      await kv.set(`user:${userId}:posts`, []);
      await kv.set(`user:${userId}:templates`, []);
      await kv.set(`user:${userId}:automations`, []);
      await kv.set(`user:${userId}:connections`, initialConnections);
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
    
    // Default platform list if no connections exist
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
    
    // Use project-specific connections if projectId provided, otherwise legacy user connections
    let connections = projectId
      ? await kv.get(`project:${projectId}:connections`)
      : await kv.get(`user:${userId}:connections`);
    
    // If no connections exist, initialize with defaults
    if (!connections || connections.length === 0) {
      connections = defaultConnections;
      // Save defaults for future requests
      if (projectId) {
        await kv.set(`project:${projectId}:connections`, defaultConnections);
      } else {
        await kv.set(`user:${userId}:connections`, defaultConnections);
      }
    }
    
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
    
    // Initialize empty platform connections for the new project
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

// ============= EBOOK ROUTES =============

// Get previous books
app.get("/make-server-19ccd85e/ebooks/previous", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const books = await kv.get(`user:${userId}:ebooks`) || [];
    
    return c.json({ books });
  } catch (error: any) {
    console.error('Get previous books error:', error);
    return c.json({ error: `Failed to fetch previous books: ${error.message}` }, 500);
  }
});

// Get AI suggestions for ebook
app.post("/make-server-19ccd85e/ebooks/suggestions", requireAuth, async (c) => {
  try {
    const { currentDetails, projectNiche, previousBooks } = await c.req.json();
    
    // Build context for AI
    const context = [];
    if (currentDetails.title) context.push(`Title: ${currentDetails.title}`);
    if (currentDetails.description) context.push(`Description: ${currentDetails.description}`);
    if (currentDetails.genre) context.push(`Genre: ${currentDetails.genre}`);
    if (projectNiche) context.push(`Project niche: ${projectNiche}`);
    if (previousBooks?.length > 0) {
      context.push(`Previous books: ${previousBooks.map((b: any) => b.title).join(', ')}`);
    }
    
    const prompt = `Based on the following ebook information, suggest appropriate values for any missing fields:
${context.join('\n')}

Please provide suggestions in JSON format for:
- genre (if not provided)
- subGenre
- tone
- intendedLength
- targetAudience
- writingStyle

Return ONLY valid JSON without any markdown formatting or explanation.`;

    // Call AI API
    const response = await fetch(
      `${Deno.env.get('AZURE_OPENAI_ENDPOINT')}/openai/deployments/${Deno.env.get('AZURE_OPENAI_DEPLOYMENT_NAME')}/chat/completions?api-version=${Deno.env.get('AZURE_OPENAI_API_VERSION')}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': Deno.env.get('AZURE_OPENAI_API_KEY') ?? '',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a helpful assistant that provides ebook writing suggestions. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    // Parse JSON response
    let suggestions;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      suggestions = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Failed to parse AI suggestions');
    }
    
    return c.json(suggestions);
  } catch (error: any) {
    console.error('Get AI suggestions error:', error);
    return c.json({ error: `Failed to get AI suggestions: ${error.message}` }, 500);
  }
});

// Generate book outline
app.post("/make-server-19ccd85e/ebooks/outline", requireAuth, async (c) => {
  try {
    const { bookDetails } = await c.req.json();
    
    const genre = bookDetails.genre === "Other" ? bookDetails.customGenre : bookDetails.genre;
    const subGenre = bookDetails.subGenre === "Other" ? bookDetails.customSubGenre : bookDetails.subGenre;
    const tone = bookDetails.tone === "Other" ? bookDetails.customTone : bookDetails.tone;
    const audience = bookDetails.targetAudience === "Other" ? bookDetails.customAudience : bookDetails.targetAudience;
    const style = bookDetails.writingStyle === "Other" ? bookDetails.customStyle : bookDetails.writingStyle;
    
    const prompt = `Create a detailed outline for an ebook with the following specifications:

Title: ${bookDetails.title}
Description: ${bookDetails.description}
Genre: ${genre}
Sub-Genre: ${subGenre}
Tone: ${tone}
Target Audience: ${audience}
Writing Style: ${style}
Intended Length: ${bookDetails.intendedLength || bookDetails.customLength}

Please provide a comprehensive chapter-by-chapter outline. Each chapter should have:
- A descriptive title
- A detailed description of what the chapter will cover
- Estimated word count

Return the outline as a JSON object with this structure:
{
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Chapter Title",
      "description": "What this chapter covers",
      "wordCount": 2500
    }
  ],
  "totalEstimatedWords": 25000
}

Return ONLY valid JSON without any markdown formatting or explanation.`;

    const response = await fetch(
      `${Deno.env.get('AZURE_OPENAI_ENDPOINT')}/openai/deployments/${Deno.env.get('AZURE_OPENAI_DEPLOYMENT_NAME')}/chat/completions?api-version=${Deno.env.get('AZURE_OPENAI_API_VERSION')}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': Deno.env.get('AZURE_OPENAI_API_KEY') ?? '',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are an expert book editor and writing coach. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    // Parse JSON response
    let outline;
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      outline = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Failed to parse outline');
    }
    
    return c.json(outline);
  } catch (error: any) {
    console.error('Generate outline error:', error);
    return c.json({ error: `Failed to generate outline: ${error.message}` }, 500);
  }
});

// Generate chapter content
app.post("/make-server-19ccd85e/ebooks/chapter", requireAuth, async (c) => {
  try {
    const { bookDetails, chapter, previousChapters } = await c.req.json();
    
    const genre = bookDetails.genre === "Other" ? bookDetails.customGenre : bookDetails.genre;
    const tone = bookDetails.tone === "Other" ? bookDetails.customTone : bookDetails.tone;
    const style = bookDetails.writingStyle === "Other" ? bookDetails.customStyle : bookDetails.writingStyle;
    
    let contextInfo = '';
    if (previousChapters && previousChapters.length > 0) {
      contextInfo = `\n\nPrevious chapters for context:\n${previousChapters.map((ch: any) => 
        `- ${ch.title}: ${ch.content.substring(0, 200)}...`
      ).join('\n')}`;
    }
    
    const prompt = `Write a complete chapter for an ebook with these specifications:

Book Title: ${bookDetails.title}
Book Description: ${bookDetails.description}
Genre: ${genre}
Tone: ${tone}
Writing Style: ${style}

Chapter Title: ${chapter.title}
Chapter Description: ${chapter.description}
${contextInfo}

Write the complete chapter content. Make it engaging, well-structured, and appropriate for the genre and target audience. Include proper paragraphs and natural flow.

Return ONLY the chapter content as plain text, without any JSON formatting or markdown.`;

    const response = await fetch(
      `${Deno.env.get('AZURE_OPENAI_ENDPOINT')}/openai/deployments/${Deno.env.get('AZURE_OPENAI_DEPLOYMENT_NAME')}/chat/completions?api-version=${Deno.env.get('AZURE_OPENAI_API_VERSION')}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': Deno.env.get('AZURE_OPENAI_API_KEY') ?? '',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are an expert author who writes engaging and professional book content.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 4000,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    const wordCount = content.split(/\s+/).length;
    
    return c.json({ content, wordCount });
  } catch (error: any) {
    console.error('Generate chapter error:', error);
    return c.json({ error: `Failed to generate chapter: ${error.message}` }, 500);
  }
});

// Generate cover art
app.post("/make-server-19ccd85e/ebooks/cover", requireAuth, async (c) => {
  try {
    const { title, genre, description } = await c.req.json();
    
    const prompt = `Professional ebook cover design for "${title}", ${genre} genre. ${description.substring(0, 100)}. High quality, modern, eye-catching design suitable for Amazon KDP.`;
    
    // Use DALL-E or similar image generation
    // For now, returning a placeholder - you would integrate with an actual image generation API
    const imageUrl = `https://placehold.co/400x600/1a1a1a/10b981?text=${encodeURIComponent(title)}`;
    
    return c.json({ imageUrl });
  } catch (error: any) {
    console.error('Generate cover art error:', error);
    return c.json({ error: `Failed to generate cover art: ${error.message}` }, 500);
  }
});

// Export ebook
app.post("/make-server-19ccd85e/ebooks/export", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { bookDetails, chapters, coverArtUrl, format } = await c.req.json();
    
    // Save book to user's collection
    const bookId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const book = {
      id: bookId,
      ...bookDetails,
      chapters: chapters.length,
      totalWords: chapters.reduce((sum: number, ch: any) => sum + ch.wordCount, 0),
      coverArtUrl,
      createdAt: new Date().toISOString(),
    };
    
    const books = await kv.get(`user:${userId}:ebooks`) || [];
    books.push(book);
    await kv.set(`user:${userId}:ebooks`, books);
    
    // Save full book data
    await kv.set(`ebook:${bookId}`, {
      ...book,
      fullChapters: chapters,
    });
    
    // Create simple text export (in a real implementation, you'd use a library to create DOCX/PDF)
    let exportContent = `${bookDetails.title}\n\n`;
    exportContent += `${bookDetails.description}\n\n`;
    exportContent += `${'='.repeat(50)}\n\n`;
    
    chapters.forEach((chapter: any, index: number) => {
      exportContent += `Chapter ${index + 1}: ${chapter.title}\n\n`;
      exportContent += `${chapter.content}\n\n`;
      exportContent += `${'='.repeat(50)}\n\n`;
    });
    
    // Return as downloadable file
    const blob = new TextEncoder().encode(exportContent);
    
    return new Response(blob, {
      headers: {
        'Content-Type': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${bookDetails.title}.${format}"`,
      },
    });
  } catch (error: any) {
    console.error('Export ebook error:', error);
    return c.json({ error: `Failed to export ebook: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);
