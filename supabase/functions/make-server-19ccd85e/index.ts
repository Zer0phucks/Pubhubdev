import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import { rateLimit, rateLimitConfigs } from "./rate-limit.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: Deno.env.get('FRONTEND_URL') || "https://pubhub.dev",
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    maxAge: 600,
    credentials: true,
  }),
);

// Apply rate limiting to all routes
app.use('*', rateLimit(rateLimitConfigs.api));

// Supabase admin client for database access and auth verification
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Initialize storage buckets on startup
async function initializeStorage() {
  const bucketName = 'make-19ccd85e-uploads';
  
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      });
      console.log('Storage bucket created:', bucketName);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Initialize storage on server start
initializeStorage();

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

// ============= STORAGE/UPLOAD ROUTES =============

// Upload profile picture
app.post("/make-server-19ccd85e/upload/profile-picture", rateLimit(rateLimitConfigs.upload), requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG are allowed.' }, 400);
    }
    
    // Validate file size (5MB max)
    if (file.size > 5242880) {
      return c.json({ error: 'File size exceeds 5MB limit' }, 400);
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `profile-pictures/${userId}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    
    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('make-19ccd85e-uploads')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: true, // Replace existing file
      });
    
    if (error) {
      console.error('Upload error:', error);
      return c.json({ error: `Upload failed: ${error.message}` }, 500);
    }
    
    // Generate signed URL (valid for 1 year)
    const { data: urlData } = await supabaseAdmin.storage
      .from('make-19ccd85e-uploads')
      .createSignedUrl(fileName, 31536000); // 1 year
    
    if (!urlData?.signedUrl) {
      return c.json({ error: 'Failed to generate signed URL' }, 500);
    }
    
    // Update user profile with image URL
    const profile = await kv.get(`user:${userId}:profile`) || {};
    profile.profilePicture = urlData.signedUrl;
    profile.profilePicturePath = fileName;
    await kv.set(`user:${userId}:profile`, profile);
    
    return c.json({ url: urlData.signedUrl, path: fileName });
  } catch (error: any) {
    console.error('Profile picture upload error:', error);
    return c.json({ error: `Upload failed: ${error.message}` }, 500);
  }
});

// Upload project logo
app.post("/make-server-19ccd85e/upload/project-logo/:projectId", rateLimit(rateLimitConfigs.upload), requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('projectId');
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    // Verify project ownership
    const project = await kv.get(`project:${projectId}`);
    if (!project || project.userId !== userId) {
      return c.json({ error: 'Project not found' }, 404);
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG are allowed.' }, 400);
    }
    
    // Validate file size (5MB max)
    if (file.size > 5242880) {
      return c.json({ error: 'File size exceeds 5MB limit' }, 400);
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `project-logos/${projectId}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    
    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('make-19ccd85e-uploads')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: true, // Replace existing file
      });
    
    if (error) {
      console.error('Upload error:', error);
      return c.json({ error: `Upload failed: ${error.message}` }, 500);
    }
    
    // Generate signed URL (valid for 1 year)
    const { data: urlData } = await supabaseAdmin.storage
      .from('make-19ccd85e-uploads')
      .createSignedUrl(fileName, 31536000); // 1 year
    
    if (!urlData?.signedUrl) {
      return c.json({ error: 'Failed to generate signed URL' }, 500);
    }
    
    // Update project with logo URL
    const updatedProject = {
      ...project,
      logo: urlData.signedUrl,
      logoPath: fileName,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`project:${projectId}`, updatedProject);
    
    return c.json({ url: urlData.signedUrl, path: fileName, project: updatedProject });
  } catch (error: any) {
    console.error('Project logo upload error:', error);
    return c.json({ error: `Upload failed: ${error.message}` }, 500);
  }
});

// ============= AUTH ROUTES =============

// Initialize user on first login (called automatically after sign up/in)
app.post("/make-server-19ccd85e/auth/initialize", rateLimit(rateLimitConfigs.auth), requireAuth, async (c) => {
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
app.get("/make-server-19ccd85e/auth/profile", rateLimit(rateLimitConfigs.api), requireAuth, async (c) => {
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

// ============= OAUTH ROUTES =============

// OAuth configuration
const getOAuthConfig = (platform: string) => {
  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://pubhub.dev';
  // Default redirect URI - check environment variables first, otherwise use /oauth/callback with platform query
  const baseRedirectUri = Deno.env.get('OAUTH_REDIRECT_URL') || `${frontendUrl}/oauth/callback`;
  const redirectUri = `${baseRedirectUri}?platform=${platform}`;
  
  const configs: Record<string, any> = {
    twitter: {
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      clientId: Deno.env.get('TWITTER_CLIENT_ID'),
      clientSecret: Deno.env.get('TWITTER_CLIENT_SECRET'),
      scope: 'tweet.read tweet.write users.read offline.access',
      redirectUri: Deno.env.get('TWITTER_REDIRECT_URI') || redirectUri,
    },
    instagram: {
      authUrl: 'https://api.instagram.com/oauth/authorize',
      tokenUrl: 'https://api.instagram.com/oauth/access_token',
      clientId: Deno.env.get('INSTAGRAM_CLIENT_ID'),
      clientSecret: Deno.env.get('INSTAGRAM_CLIENT_SECRET'),
      scope: 'user_profile,user_media',
      redirectUri: Deno.env.get('INSTAGRAM_REDIRECT_URI') || redirectUri,
    },
    linkedin: {
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientId: Deno.env.get('LINKEDIN_CLIENT_ID'),
      clientSecret: Deno.env.get('LINKEDIN_CLIENT_SECRET'),
      scope: 'w_member_social r_liteprofile',
      redirectUri: Deno.env.get('LINKEDIN_REDIRECT_URI') || redirectUri,
    },
    facebook: {
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      clientId: Deno.env.get('FACEBOOK_APP_ID'),
      clientSecret: Deno.env.get('FACEBOOK_APP_SECRET'),
      scope: 'pages_manage_posts,pages_read_engagement',
      redirectUri: Deno.env.get('FACEBOOK_REDIRECT_URI') || redirectUri,
    },
    youtube: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: Deno.env.get('YOUTUBE_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID'),
      clientSecret: Deno.env.get('YOUTUBE_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET'),
      scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube',
      redirectUri: Deno.env.get('YOUTUBE_REDIRECT_URI') || Deno.env.get('OAUTH_REDIRECT_URL') || redirectUri,
    },
    tiktok: {
      authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
      tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
      clientId: Deno.env.get('TIKTOK_CLIENT_KEY'),
      clientSecret: Deno.env.get('TIKTOK_CLIENT_SECRET'),
      scope: 'user.info.basic,video.upload',
      redirectUri: Deno.env.get('TIKTOK_REDIRECT_URI') || redirectUri,
    },
    pinterest: {
      authUrl: 'https://www.pinterest.com/oauth/',
      tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
      clientId: Deno.env.get('PINTEREST_APP_ID'),
      clientSecret: Deno.env.get('PINTEREST_APP_SECRET'),
      scope: 'boards:read,pins:read,pins:write',
      redirectUri: Deno.env.get('PINTEREST_REDIRECT_URI') || redirectUri,
    },
    reddit: {
      authUrl: 'https://www.reddit.com/api/v1/authorize',
      tokenUrl: 'https://www.reddit.com/api/v1/access_token',
      clientId: Deno.env.get('REDDIT_CLIENT_ID'),
      clientSecret: Deno.env.get('REDDIT_CLIENT_SECRET'),
      scope: 'submit,identity',
      redirectUri: Deno.env.get('REDDIT_REDIRECT_URI') || redirectUri,
    },
  };
  
  return configs[platform];
};

// Start OAuth flow - generates authorization URL
app.get("/make-server-19ccd85e/oauth/authorize/:platform", rateLimit(rateLimitConfigs.auth), requireAuth, async (c) => {
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
        error: `OAuth not configured for ${platform}. Please add ${platform.toUpperCase()}_CLIENT_ID and ${platform.toUpperCase()}_CLIENT_SECRET environment variables.` 
      }, 400);
    }
    
    // Generate state for CSRF protection
    const state = `${userId}:${projectId}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate PKCE verifier for Twitter OAuth 2.0
    let codeVerifier: string | undefined;
    if (platform === 'twitter') {
      // Generate a random code verifier (43-128 characters)
      codeVerifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    
    // Store state temporarily for verification (including code_verifier for Twitter)
    await kv.set(`oauth:state:${state}`, {
      userId,
      projectId,
      platform,
      codeVerifier,
      createdAt: Date.now(),
    }, { expiresIn: 600 }); // 10 minute expiry
    
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

// Handle OAuth callback - exchange code for token
app.post("/make-server-19ccd85e/oauth/callback", rateLimit(rateLimitConfigs.auth), requireAuth, async (c) => {
  try {
    const { code, state, platform } = await c.req.json();
    const userId = c.get('userId');
    
    if (!code || !state || !platform) {
      return c.json({ error: 'Missing required parameters' }, 400);
    }
    
    // Verify state
    const stateData = await kv.get(`oauth:state:${state}`);
    
    if (!stateData || stateData.userId !== userId) {
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
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });
    
    // Some platforms need special handling
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    
    // Twitter OAuth 2.0 with PKCE requires Basic Auth and code_verifier
    if (platform === 'twitter') {
      // Twitter requires Basic Authentication header
      const basicAuth = btoa(`${config.clientId}:${config.clientSecret}`);
      headers['Authorization'] = `Basic ${basicAuth}`;
      // Remove client credentials from body when using Basic Auth
      tokenParams.delete('client_id');
      tokenParams.delete('client_secret');
      // Add code_verifier for PKCE
      if (stateData.codeVerifier) {
        tokenParams.set('code_verifier', stateData.codeVerifier);
      }
    }
    
    // Reddit requires Basic Auth
    if (platform === 'reddit') {
      const basicAuth = btoa(`${config.clientId}:${config.clientSecret}`);
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
    
    const tokenData = await tokenResponse.json();
    
    // Get user info from platform
    let userInfo: any = {};
    
    try {
      if (platform === 'twitter') {
        const meResponse = await fetch('https://api.twitter.com/2/users/me', {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        });
        const meData = await meResponse.json();
        userInfo = {
          username: meData.data?.username,
          name: meData.data?.name,
          id: meData.data?.id,
        };
      } else if (platform === 'instagram') {
        const meResponse = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${tokenData.access_token}`);
        const meData = await meResponse.json();
        userInfo = {
          username: meData.username,
          id: meData.id,
        };
      } else if (platform === 'linkedin') {
        const meResponse = await fetch('https://api.linkedin.com/v2/me', {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        });
        const meData = await meResponse.json();
        userInfo = {
          name: `${meData.localizedFirstName} ${meData.localizedLastName}`,
          id: meData.id,
        };
      } else if (platform === 'facebook') {
        const meResponse = await fetch(`https://graph.facebook.com/me?fields=id,name&access_token=${tokenData.access_token}`);
        const meData = await meResponse.json();
        userInfo = {
          name: meData.name,
          id: meData.id,
        };
      } else if (platform === 'youtube') {
        const meResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        });
        const meData = await meResponse.json();
        userInfo = {
          username: meData.items?.[0]?.snippet?.title,
          id: meData.items?.[0]?.id,
        };
      } else if (platform === 'reddit') {
        const meResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
          headers: { 
            'Authorization': `Bearer ${tokenData.access_token}`,
            'User-Agent': 'PubHub/1.0',
          },
        });
        const meData = await meResponse.json();
        userInfo = {
          username: meData.name,
          id: meData.id,
        };
      } else if (platform === 'tiktok') {
        const meResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        });
        const meData = await meResponse.json();
        userInfo = {
          username: meData.data?.user?.display_name,
          id: meData.data?.user?.open_id,
        };
      } else if (platform === 'pinterest') {
        const meResponse = await fetch('https://api.pinterest.com/v5/user_account', {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        });
        const meData = await meResponse.json();
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
      projectId: stateData.projectId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : null,
      userInfo,
      connectedAt: new Date().toISOString(),
    };
    
    await kv.set(`oauth:token:${platform}:${stateData.projectId}`, tokenRecord);
    
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
    let connections = await kv.get(`project:${stateData.projectId}:connections`);
    
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
    
    await kv.set(`project:${stateData.projectId}:connections`, updatedConnections);
    
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

// Disconnect OAuth platform
app.post("/make-server-19ccd85e/oauth/disconnect", requireAuth, async (c) => {
  try {
    const { platform, projectId } = await c.req.json();
    const userId = c.get('userId');
    
    if (!platform || !projectId) {
      return c.json({ error: 'Missing required parameters' }, 400);
    }
    
    // Delete OAuth tokens
    await kv.del(`oauth:token:${platform}:${projectId}`);
    
    // Update project connections
    const connections = await kv.get(`project:${projectId}:connections`) || [];
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

// Get OAuth token (for making API calls)
app.get("/make-server-19ccd85e/oauth/token/:platform/:projectId", requireAuth, async (c) => {
  try {
    const platform = c.req.param('platform');
    const projectId = c.req.param('projectId');
    const userId = c.get('userId');
    
    const tokenRecord = await kv.get(`oauth:token:${platform}:${projectId}`);
    
    if (!tokenRecord || tokenRecord.userId !== userId) {
      return c.json({ error: 'Token not found' }, 404);
    }
    
    // Check if token expired and needs refresh
    if (tokenRecord.expiresAt && Date.now() > tokenRecord.expiresAt && tokenRecord.refreshToken) {
      // Refresh the token
      const config = getOAuthConfig(platform);
      
      if (config) {
        try {
          const refreshParams = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokenRecord.refreshToken,
            client_id: config.clientId,
            client_secret: config.clientSecret,
          });
          
          const refreshResponse = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: refreshParams.toString(),
          });
          
          if (refreshResponse.ok) {
            const newTokenData = await refreshResponse.json();
            
            // Update stored token
            const updatedRecord = {
              ...tokenRecord,
              accessToken: newTokenData.access_token,
              refreshToken: newTokenData.refresh_token || tokenRecord.refreshToken,
              expiresAt: newTokenData.expires_in ? Date.now() + (newTokenData.expires_in * 1000) : null,
            };
            
            await kv.set(`oauth:token:${platform}:${projectId}`, updatedRecord);
            
            return c.json({ accessToken: newTokenData.access_token });
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }
    }
    
    return c.json({ accessToken: tokenRecord.accessToken });
  } catch (error: any) {
    console.error('Get token error:', error);
    return c.json({ error: `Failed to get token: ${error.message}` }, 500);
  }
});

// ============= PLATFORM POSTING ROUTES =============

// Publish content to social media platforms
app.post("/make-server-19ccd85e/posts/publish", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { postId, platforms, projectId, content, media } = await c.req.json();

    if (!platforms || platforms.length === 0) {
      return c.json({ error: 'No platforms specified' }, 400);
    }

    const results = [];

    for (const platform of platforms) {
      try {
        // Get OAuth token for platform
        const tokenRecord = await kv.get(`oauth:token:${platform}:${projectId}`);

        if (!tokenRecord) {
          results.push({
            platform,
            success: false,
            error: 'Platform not connected'
          });
          continue;
        }

        let publishResult;

        switch (platform) {
          case 'twitter':
            publishResult = await publishToTwitter(tokenRecord.accessToken, content, media);
            break;
          case 'instagram':
            publishResult = await publishToInstagram(tokenRecord.accessToken, content, media);
            break;
          case 'linkedin':
            publishResult = await publishToLinkedIn(tokenRecord.accessToken, content, media);
            break;
          case 'facebook':
            publishResult = await publishToFacebook(tokenRecord.accessToken, content, media);
            break;
          case 'youtube':
            publishResult = await publishToYouTube(tokenRecord.accessToken, content, media);
            break;
          case 'tiktok':
            publishResult = await publishToTikTok(tokenRecord.accessToken, content, media);
            break;
          case 'pinterest':
            publishResult = await publishToPinterest(tokenRecord.accessToken, content, media);
            break;
          case 'reddit':
            publishResult = await publishToReddit(tokenRecord.accessToken, content, media);
            break;
          default:
            publishResult = { success: false, error: 'Platform not supported' };
        }

        results.push({
          platform,
          ...publishResult
        });

      } catch (error: any) {
        console.error(`Error publishing to ${platform}:`, error);
        results.push({
          platform,
          success: false,
          error: error.message
        });
      }
    }

    // Update post status in database
    if (postId) {
      const postsKey = `project:${projectId}:posts`;
      const posts = await kv.get(postsKey) || [];
      const updatedPosts = posts.map((post: any) => {
        if (post.id === postId) {
          return {
            ...post,
            publishedPlatforms: results.filter(r => r.success).map(r => r.platform),
            publishStatus: results,
            lastPublished: new Date().toISOString()
          };
        }
        return post;
      });
      await kv.set(postsKey, updatedPosts);
    }

    return c.json({
      success: true,
      results,
      summary: {
        total: platforms.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

  } catch (error: any) {
    console.error('Publish error:', error);
    return c.json({ error: `Failed to publish: ${error.message}` }, 500);
  }
});

// Platform-specific publishing functions

async function publishToTwitter(accessToken: string, content: any, media: any) {
  try {
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: content.text || content.caption
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to post to Twitter');
    }

    return {
      success: true,
      postId: data.data.id,
      url: `https://twitter.com/i/web/status/${data.data.id}`
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function publishToInstagram(accessToken: string, content: any, media: any) {
  try {
    // Instagram requires media, can't post text-only
    if (!media || !media.url) {
      return { success: false, error: 'Instagram requires an image or video' };
    }

    // Step 1: Create media container
    const createResponse = await fetch(
      `https://graph.instagram.com/me/media?image_url=${encodeURIComponent(media.url)}&caption=${encodeURIComponent(content.caption || content.text)}&access_token=${accessToken}`,
      { method: 'POST' }
    );

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(createData.error?.message || 'Failed to create Instagram media');
    }

    // Step 2: Publish the media container
    const publishResponse = await fetch(
      `https://graph.instagram.com/me/media_publish?creation_id=${createData.id}&access_token=${accessToken}`,
      { method: 'POST' }
    );

    const publishData = await publishResponse.json();

    if (!publishResponse.ok) {
      throw new Error(publishData.error?.message || 'Failed to publish to Instagram');
    }

    return {
      success: true,
      postId: publishData.id,
      url: `https://instagram.com/p/${publishData.id}`
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function publishToLinkedIn(accessToken: string, content: any, media: any) {
  try {
    // First, get the user's LinkedIn ID
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const profileData = await profileResponse.json();
    const authorId = `urn:li:person:${profileData.id}`;

    const postBody: any = {
      author: authorId,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content.text || content.caption
          },
          shareMediaCategory: media ? 'IMAGE' : 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    if (media && media.url) {
      // TODO: Implement LinkedIn image upload (requires multi-step process)
      // For now, we'll post text-only
    }

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postBody)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to post to LinkedIn');
    }

    return {
      success: true,
      postId: data.id,
      url: `https://linkedin.com/feed/update/${data.id}`
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function publishToFacebook(accessToken: string, content: any, media: any) {
  try {
    // Get page access token first (assuming user wants to post to their page)
    const pagesResponse = await fetch(
      `https://graph.facebook.com/me/accounts?access_token=${accessToken}`
    );

    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return { success: false, error: 'No Facebook pages found' };
    }

    // Use the first page
    const page = pagesData.data[0];
    const pageAccessToken = page.access_token;

    let endpoint = `https://graph.facebook.com/${page.id}/feed`;
    const params = new URLSearchParams({
      message: content.text || content.caption,
      access_token: pageAccessToken
    });

    if (media && media.url) {
      endpoint = `https://graph.facebook.com/${page.id}/photos`;
      params.append('url', media.url);
    }

    const response = await fetch(`${endpoint}?${params}`, {
      method: 'POST'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to post to Facebook');
    }

    return {
      success: true,
      postId: data.id,
      url: `https://facebook.com/${data.id}`
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function publishToYouTube(accessToken: string, content: any, media: any) {
  try {
    // YouTube requires video upload
    if (!media || !media.videoUrl) {
      return { success: false, error: 'YouTube requires a video file' };
    }

    // TODO: Implement YouTube video upload
    // This requires multipart upload and is more complex
    // For now, return a placeholder

    return {
      success: false,
      error: 'YouTube video upload not yet implemented - requires video file upload'
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function publishToTikTok(accessToken: string, content: any, media: any) {
  try {
    // TikTok requires video
    if (!media || !media.videoUrl) {
      return { success: false, error: 'TikTok requires a video file' };
    }

    // TikTok's content posting API is currently limited
    // Requires approved production access

    return {
      success: false,
      error: 'TikTok posting requires production API access approval'
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function publishToPinterest(accessToken: string, content: any, media: any) {
  try {
    // Pinterest requires media
    if (!media || !media.url) {
      return { success: false, error: 'Pinterest requires an image' };
    }

    // Get boards first
    const boardsResponse = await fetch('https://api.pinterest.com/v5/boards', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const boardsData = await boardsResponse.json();

    if (!boardsData.items || boardsData.items.length === 0) {
      return { success: false, error: 'No Pinterest boards found' };
    }

    // Use the first board
    const board = boardsData.items[0];

    const response = await fetch('https://api.pinterest.com/v5/pins', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        board_id: board.id,
        media_source: {
          source_type: 'image_url',
          url: media.url
        },
        title: content.title || 'Pin from PubHub',
        description: content.text || content.caption
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to post to Pinterest');
    }

    return {
      success: true,
      postId: data.id,
      url: `https://pinterest.com/pin/${data.id}`
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function publishToReddit(accessToken: string, content: any, media: any) {
  try {
    // Reddit requires a subreddit
    const subreddit = content.subreddit || 'test'; // Default to r/test for testing

    const formData = new FormData();
    formData.append('api_type', 'json');
    formData.append('kind', media ? 'link' : 'self');
    formData.append('sr', subreddit);
    formData.append('title', content.title || content.text?.substring(0, 100) || 'Post from PubHub');

    if (media && media.url) {
      formData.append('url', media.url);
    } else {
      formData.append('text', content.text || content.caption);
    }

    const response = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'PubHub/1.0'
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok || data.json?.errors?.length > 0) {
      const error = data.json?.errors?.[0]?.[1] || 'Failed to post to Reddit';
      throw new Error(error);
    }

    const postData = data.json.data;
    return {
      success: true,
      postId: postData.name,
      url: `https://reddit.com${postData.url}`
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// AI CHAT ASSISTANT WITH FUNCTION CALLING
// ============================================

/**
 * AI Chat Assistant - Context-aware with action capabilities
 * Supports function calling for:
 * - Querying user data (posts, analytics, connections)
 * - Creating and scheduling posts
 * - Managing content across platforms
 */
app.post("/make-server-19ccd85e/ai/chat", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { messages, projectId } = await c.req.json();

    // Define available tools for the AI
    const tools = [
      {
        type: "function",
        function: {
          name: "get_user_posts",
          description: "Get the user's posts, optionally filtered by project, platform, or status",
          parameters: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID to filter posts" },
              platform: {
                type: "string",
                enum: ["twitter", "instagram", "linkedin", "facebook", "youtube", "tiktok", "pinterest", "reddit", "blog"],
                description: "Platform to filter posts"
              },
              status: {
                type: "string",
                enum: ["draft", "scheduled", "published", "failed"],
                description: "Status to filter posts"
              },
              limit: { type: "number", description: "Maximum number of posts to return", default: 10 }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_platform_connections",
          description: "Get the user's connected platforms for a project",
          parameters: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID to get connections for" }
            },
            required: ["projectId"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_post",
          description: "Create and optionally schedule a new post across one or more platforms",
          parameters: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID for the post" },
              content: { type: "string", description: "The post content/caption" },
              platforms: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["twitter", "instagram", "linkedin", "facebook", "youtube", "tiktok", "pinterest", "reddit", "blog"]
                },
                description: "Platforms to post to"
              },
              scheduledTime: {
                type: "string",
                description: "ISO 8601 datetime string for when to publish (e.g., '2025-01-15T08:00:00Z'). If not provided, post is saved as draft."
              },
              mediaUrls: {
                type: "array",
                items: { type: "string" },
                description: "URLs of media attachments"
              }
            },
            required: ["projectId", "content", "platforms"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_projects",
          description: "Get all projects for the user",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function",
        function: {
          name: "parse_datetime",
          description: "Parse natural language datetime expressions into ISO 8601 format (e.g., 'Tuesday at 8am', 'tomorrow 3pm', 'next Friday 2:30pm')",
          parameters: {
            type: "object",
            properties: {
              expression: { type: "string", description: "Natural language datetime expression" },
              timezone: { type: "string", description: "User's timezone (e.g., 'America/New_York')", default: "UTC" }
            },
            required: ["expression"]
          }
        }
      }
    ];

    // Build system message with user context
    const systemMessage = {
      role: "system",
      content: `You are PubHub AI, an intelligent assistant for content creators. You help users manage their social media content across multiple platforms.

You have access to the following capabilities:
- View and analyze user's posts and content
- Check connected social media platforms
- Create and schedule posts across multiple platforms
- Parse natural language date/time expressions

When users ask you to create or schedule posts:
1. First use parse_datetime to convert any natural language time expressions to ISO format
2. Then use create_post with the proper ISO datetime in scheduledTime
3. Always confirm what you're about to do before executing actions
4. Be conversational and helpful

Current context:
- User ID: ${userId}
- Active Project ID: ${projectId || 'No project selected'}

Guidelines:
- Be concise but friendly
- When creating posts, confirm the details before proceeding
- If scheduling, always confirm the date and time with the user
- If multiple platforms are requested, create posts for all of them
- Provide helpful suggestions for content optimization`
    };

    // Call Azure OpenAI with function calling
    const response = await fetch(
      `${Deno.env.get('AZURE_OPENAI_ENDPOINT')}/openai/deployments/${Deno.env.get('AZURE_OPENAI_DEPLOYMENT_NAME')}/chat/completions?api-version=${Deno.env.get('AZURE_OPENAI_API_VERSION')}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': Deno.env.get('AZURE_OPENAI_API_KEY') ?? '',
        },
        body: JSON.stringify({
          messages: [systemMessage, ...messages],
          tools,
          tool_choice: "auto",
          temperature: 0.7,
          max_tokens: 1000,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    // Handle function calls
    if (assistantMessage.tool_calls) {
      const toolResults = [];

      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        let result;

        try {
          switch (functionName) {
            case "get_user_posts":
              result = await executeGetUserPosts(userId, functionArgs);
              break;
            case "get_platform_connections":
              result = await executeGetPlatformConnections(userId, functionArgs.projectId);
              break;
            case "create_post":
              result = await executeCreatePost(userId, functionArgs);
              break;
            case "get_projects":
              result = await executeGetProjects(userId);
              break;
            case "parse_datetime":
              result = await executeParseDatetime(functionArgs);
              break;
            default:
              result = { error: `Unknown function: ${functionName}` };
          }
        } catch (error: any) {
          result = { error: error.message };
        }

        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: JSON.stringify(result)
        });
      }

      // Call AI again with function results
      const followUpResponse = await fetch(
        `${Deno.env.get('AZURE_OPENAI_ENDPOINT')}/openai/deployments/${Deno.env.get('AZURE_OPENAI_DEPLOYMENT_NAME')}/chat/completions?api-version=${Deno.env.get('AZURE_OPENAI_API_VERSION')}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': Deno.env.get('AZURE_OPENAI_API_KEY') ?? '',
          },
          body: JSON.stringify({
            messages: [
              systemMessage,
              ...messages,
              assistantMessage,
              ...toolResults
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        }
      );

      const followUpData = await followUpResponse.json();
      return c.json({
        success: true,
        message: followUpData.choices[0].message.content,
        functionsCalled: assistantMessage.tool_calls.map((tc: any) => tc.function.name)
      });
    }

    // No function calls, return response directly
    return c.json({
      success: true,
      message: assistantMessage.content
    });

  } catch (error: any) {
    console.error('AI chat error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Tool execution functions
async function executeGetUserPosts(userId: string, args: any) {
  const { projectId, platform, status, limit = 10 } = args;

  let postIds;
  if (projectId) {
    postIds = await kv.get(`project:${projectId}:posts`) || [];
  } else {
    postIds = await kv.get(`user:${userId}:posts`) || [];
  }

  const posts = await Promise.all(
    postIds.slice(0, limit).map(async (id: string) => await kv.get(`post:${id}`))
  );

  let filtered = posts.filter(Boolean);

  if (platform) {
    filtered = filtered.filter((post: any) =>
      post.platforms?.includes(platform) || post.platform === platform
    );
  }

  if (status) {
    filtered = filtered.filter((post: any) => post.status === status);
  }

  return {
    posts: filtered.map((post: any) => ({
      id: post.id,
      content: post.content,
      platforms: post.platforms || [post.platform],
      status: post.status,
      scheduledTime: post.scheduledTime,
      createdAt: post.createdAt
    })),
    total: filtered.length
  };
}

async function executeGetPlatformConnections(userId: string, projectId: string) {
  const projectConnections = await kv.get(`project:${projectId}:connections`) || {};

  const connections = [];
  for (const [platform, tokenData] of Object.entries(projectConnections)) {
    if (tokenData && typeof tokenData === 'object' && (tokenData as any).access_token) {
      connections.push({
        platform,
        connected: true,
        username: (tokenData as any).username || 'Unknown'
      });
    }
  }

  return { connections, total: connections.length };
}

async function executeCreatePost(userId: string, args: any) {
  const { projectId, content, platforms, scheduledTime, mediaUrls = [] } = args;

  const postId = `post-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const post = {
    id: postId,
    projectId,
    userId,
    content,
    platforms,
    status: scheduledTime ? 'scheduled' : 'draft',
    scheduledTime,
    mediaUrls,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await kv.set(`post:${postId}`, post);

  // Add to project posts
  const projectPostIds = await kv.get(`project:${projectId}:posts`) || [];
  projectPostIds.push(postId);
  await kv.set(`project:${projectId}:posts`, projectPostIds);

  return {
    success: true,
    postId,
    status: post.status,
    scheduledTime,
    platforms
  };
}

async function executeGetProjects(userId: string) {
  const projectIds = await kv.get(`user:${userId}:projects`) || [];
  const projects = await Promise.all(
    projectIds.map(async (id: string) => await kv.get(`project:${id}`))
  );

  return {
    projects: projects.filter(Boolean).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description
    })),
    total: projects.length
  };
}

async function executeParseDatetime(args: any) {
  const { expression, timezone = "UTC" } = args;

  // Simple date parsing logic
  // This is a basic implementation - you might want to use a library like chrono-node for production
  const now = new Date();
  let targetDate = new Date(now);

  // Convert expression to lowercase for easier matching
  const expr = expression.toLowerCase();

  // Handle "tuesday", "wednesday", etc.
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayMatch = days.findIndex(day => expr.includes(day));

  if (dayMatch !== -1) {
    const currentDay = now.getDay();
    let daysToAdd = dayMatch - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7; // Next week
    targetDate.setDate(now.getDate() + daysToAdd);
  }

  // Handle "tomorrow"
  if (expr.includes('tomorrow')) {
    targetDate.setDate(now.getDate() + 1);
  }

  // Handle "next week"
  if (expr.includes('next week')) {
    targetDate.setDate(now.getDate() + 7);
  }

  // Handle time like "8am", "3pm", "14:30"
  const timeMatch = expr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridiem = timeMatch[3];

    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    targetDate.setHours(hours, minutes, 0, 0);
  }

  return {
    originalExpression: expression,
    parsedDate: targetDate.toISOString(),
    humanReadable: targetDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone
    })
  };
}

Deno.serve(app.fetch);
