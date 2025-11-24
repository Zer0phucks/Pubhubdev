import { http, HttpResponse } from 'msw';
import {
  createSession,
  ensureUserProject,
  formatSupabaseUser,
  getProjectConnections,
  getUserByToken,
  loadDatabase,
  saveDatabase,
  type AutomationRecord,
  type ConnectionRecord,
  type InboxMessageRecord,
  type MockDatabase,
  type PostRecord,
  type ProjectRecord,
  type TemplateRecord,
  type TrendingRecord,
  type SettingsRecord,
} from './db';

// Mock API base URL for testing
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

function jsonResponse<T>(
  data: T,
  init: ResponseInit = {},
) {
  return HttpResponse.json(data, {
    headers: corsHeaders,
    ...init,
  });
}

function noContent() {
  return new HttpResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function unauthorized(message = 'Unauthorized') {
  return HttpResponse.json(
    { error: message },
    {
      status: 401,
      headers: corsHeaders,
    },
  );
}

function notFound(message = 'Not found') {
  return HttpResponse.json(
    { error: message },
    {
      status: 404,
      headers: corsHeaders,
    },
  );
}

function parseJson<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

function requireAuth(request: Request) {
  const db = loadDatabase();
  const authHeader = request.headers.get('authorization');
  const result = getUserByToken(db, authHeader);
  return { db, result };
}

function attachSession(db: MockDatabase, userId: string) {
  const tokens = createSession(db, userId);
  const user = db.users.find((u) => u.id === userId)!;
  return {
    user: formatSupabaseUser(user),
    session: {
      access_token: tokens.token,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(tokens.expiresAt / 1000),
      refresh_token: tokens.refreshToken,
      user: formatSupabaseUser(user),
    },
  };
}

function ensureDemoData(db: MockDatabase, userId: string) {
  ensureUserProject(db, userId);
  saveDatabase(db);
  return db;
}

function getCurrentProject(db: MockDatabase, userId: string) {
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;
  if (user.currentProjectId) {
    return db.projects.find((p) => p.id === user.currentProjectId) ?? null;
  }
  const first = db.projects.find((p) => p.userId === userId) ?? null;
  if (first) {
    user.currentProjectId = first.id;
    saveDatabase(db);
  }
  return first;
}

function summarizeAnalytics(posts: PostRecord[]) {
  const total = posts.length;
  const published = posts.filter((p) => p.status === 'published').length;
  const scheduled = posts.filter((p) => p.status === 'scheduled').length;

  return {
    totals: {
      posts: total,
      published,
      scheduled,
    },
    engagement: {
      average: 3.7,
      topPost: posts[0]?.content ?? 'No posts yet',
    },
    performance: [
      { label: 'CTR', value: '4.1%' },
      { label: 'Watch Time', value: '12m 45s' },
      { label: 'Shares', value: '184' },
      { label: 'Saves', value: '231' },
    ],
  };
}

function getTrendingSamples(projectId: string): TrendingRecord[] {
  const db = loadDatabase();
  const base = db.trending.length
    ? db.trending
    : [
        {
          id: crypto.randomUUID(),
          platform: 'twitter',
          title: 'Creator economy playbooks',
          content:
            'The best solo creators are systems thinkers. They map creation → distribution → community. Here’s a 5-step workflow.',
          engagement: 12844,
          author: '@creatoreconomy',
          postedAt: new Date().toISOString(),
        },
      ];

  return base.map((item) => ({
    ...item,
    id: `${projectId}-${item.id}`,
  }));
}

export const handlers = [
  // ----------- CORS HANDLER -----------
  http.options(/https:\/\/.*supabase\.co\/.*$/, () => {
    return new HttpResponse(null, {
      status: 200,
      headers: corsHeaders,
    });
  }),

  // ----------- AUTH HANDLERS -----------
  http.post(`${SUPABASE_BASE}/auth/v1/signup`, async ({ request }) => {
    const { email, password, data } = await parseJson<{
      email: string;
      password: string;
      data?: { name?: string };
    }>(request);

    const db = loadDatabase();
    const existing = db.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return HttpResponse.json(
        { error_description: 'User already registered', error: 'user_exists' },
        { status: 400, headers: corsHeaders },
      );
    }

    const now = new Date().toISOString();
    const userId = crypto.randomUUID();
    db.users.push({
      id: userId,
      email,
      password,
      name: data?.name || email.split('@')[0],
      createdAt: now,
      profilePicture: null,
      currentProjectId: undefined,
    });

    ensureDemoData(db, userId);
    const payload = attachSession(db, userId);
    saveDatabase(db);

    return jsonResponse(payload);
  }),

  http.post(`${SUPABASE_BASE}/auth/v1/token`, async ({ request }) => {
    const url = new URL(request.url);
    const grantType = url.searchParams.get('grant_type');
    if (grantType !== 'password') {
      return HttpResponse.json(
        { error: 'unsupported_grant_type', error_description: 'Only password grant is supported in demo mode.' },
        { status: 400, headers: corsHeaders },
      );
    }

    const { email, password } = await parseJson<{ email: string; password: string }>(request);
    const db = loadDatabase();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.password !== password) {
      return HttpResponse.json(
        { error: 'invalid_credentials', error_description: 'Invalid email or password' },
        { status: 400, headers: corsHeaders },
      );
    }

    ensureDemoData(db, user.id);
    const payload = attachSession(db, user.id);
    saveDatabase(db);
    return jsonResponse(payload);
  }),

  http.get(`${SUPABASE_BASE}/auth/v1/user`, ({ request }) => {
    const db = loadDatabase();
    const auth = getUserByToken(db, request.headers.get('authorization'));
    if (!auth) {
      return unauthorized();
    }
    const { user } = auth;
    return jsonResponse({ user: formatSupabaseUser(user) });
  }),

  http.post(`${SUPABASE_BASE}/auth/v1/logout`, ({ request }) => {
    const db = loadDatabase();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return unauthorized();
    }
    const token = authHeader.slice(7);
    db.sessions = db.sessions.filter((session) => session.token !== token);
    saveDatabase(db);
    return noContent();
  }),

  // ----------- EDGE FUNCTION HANDLERS -----------
  http.get(`${FUNCTIONS_BASE}/health`, () => jsonResponse({ status: 'ok' })),

  http.get(`${FUNCTIONS_BASE}/auth/profile`, ({ request }) => {
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const { user } = result;
    return jsonResponse({ user: { id: user.id, email: user.email, name: user.name, profilePicture: user.profilePicture ?? null } });
  }),

  http.post(`${FUNCTIONS_BASE}/auth/profile`, ({ request }) => {
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    ensureDemoData(db, result.user.id);
    return jsonResponse({ success: true });
  }),

  // Projects
  http.get(`${FUNCTIONS_BASE}/projects`, ({ request }) => {
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const projects = db.projects.filter((project) => project.userId === result.user.id);
    return jsonResponse({ projects });
  }),

  http.get(`${FUNCTIONS_BASE}/projects/current`, ({ request }) => {
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const project = getCurrentProject(db, result.user.id);
    if (!project) return notFound('No projects found');
    return jsonResponse({ project });
  }),

  http.put(`${FUNCTIONS_BASE}/projects/current`, async ({ request }) => {
    const body = await parseJson<{ projectId: string }>(request);
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const project = db.projects.find((p) => p.id === body.projectId && p.userId === result.user.id);
    if (!project) return notFound('Project not found');
    db.users = db.users.map((u) =>
      u.id === result.user.id ? { ...u, currentProjectId: project.id } : u,
    );
    saveDatabase(db);
    return jsonResponse({ project });
  }),

  http.post(`${FUNCTIONS_BASE}/projects`, async ({ request }) => {
    const { name, description } = await parseJson<{ name: string; description?: string }>(request);
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const now = new Date().toISOString();
    const project: ProjectRecord = {
      id: crypto.randomUUID(),
      userId: result.user.id,
      name,
      description,
      createdAt: now,
      updatedAt: now,
    };
    db.projects.push(project);
    db.connections.push({
      projectId: project.id,
      connections: structuredClone(getProjectConnections(db, result.user.currentProjectId ?? project.id)),
    });
    result.user.currentProjectId = project.id;
    saveDatabase(db);
    return jsonResponse({ project });
  }),

  http.put(`${FUNCTIONS_BASE}/projects/:projectId`, async ({ params, request }) => {
    const { projectId } = params;
    const updates = await parseJson<Partial<ProjectRecord>>(request);
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const idx = db.projects.findIndex((p) => p.id === projectId && p.userId === result.user.id);
    if (idx === -1) return notFound('Project not found');
    db.projects[idx] = {
      ...db.projects[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase(db);
    return jsonResponse({ project: db.projects[idx] });
  }),

  http.delete(`${FUNCTIONS_BASE}/projects/:projectId`, ({ params, request }) => {
    const { projectId } = params;
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const before = db.projects.length;
    db.projects = db.projects.filter((project) => !(project.id === projectId && project.userId === result.user.id));
    if (db.projects.length === before) {
      return notFound('Project not found');
    }
    db.posts = db.posts.filter((post) => post.projectId !== projectId);
    db.templates = db.templates.filter((template) => template.projectId !== projectId);
    db.automations = db.automations.filter((automation) => automation.projectId !== projectId);
    db.connections = db.connections.filter((c) => c.projectId !== projectId);
    if (result.user.currentProjectId === projectId) {
      result.user.currentProjectId = db.projects.find((p) => p.userId === result.user.id)?.id;
    }
    saveDatabase(db);
    return jsonResponse({ success: true });
  }),

  // Posts
  http.get(`${FUNCTIONS_BASE}/posts`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const platform = url.searchParams.get('platform');
    const projectId = url.searchParams.get('projectId');

    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();

    const effectiveProject = projectId || getCurrentProject(db, result.user.id)?.id;
    const posts = db.posts.filter((post) => post.projectId === effectiveProject);
    const filtered = posts.filter((post) => {
      if (status && post.status !== status) return false;
      if (platform && !post.platforms.includes(platform as any)) return false;
      return true;
    });

    return jsonResponse({ posts: filtered });
  }),

  http.post(`${FUNCTIONS_BASE}/posts`, async ({ request }) => {
    const payload = await parseJson<Partial<PostRecord> & { projectId?: string }>(request);
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();

    const project = payload.projectId || getCurrentProject(db, result.user.id)?.id;
    if (!project) return notFound('Project not found');

    const now = new Date().toISOString();
    const post: PostRecord = {
      id: crypto.randomUUID(),
      projectId: project,
      content: payload.content || '',
      status: (payload.status as PostStatus) || 'draft',
      platforms: payload.platforms ?? ['twitter'],
      createdAt: now,
      updatedAt: now,
      scheduledFor: payload.scheduledFor || null,
      publishedAt: payload.status === 'published' ? now : null,
      attachments: payload.attachments,
    };
    db.posts.unshift(post);
    saveDatabase(db);
    return jsonResponse({ post });
  }),

  http.put(`${FUNCTIONS_BASE}/posts/:postId`, async ({ params, request }) => {
    const updates = await parseJson<Partial<PostRecord>>(request);
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();

    const idx = db.posts.findIndex((post) => post.id === params.postId);
    if (idx === -1) return notFound('Post not found');

    db.posts[idx] = {
      ...db.posts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase(db);
    return jsonResponse({ post: db.posts[idx] });
  }),

  http.delete(`${FUNCTIONS_BASE}/posts/:postId`, ({ params, request }) => {
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const before = db.posts.length;
    db.posts = db.posts.filter((post) => post.id !== params.postId);
    if (db.posts.length === before) return notFound('Post not found');
    saveDatabase(db);
    return jsonResponse({ success: true });
  }),

  // Connections
  http.get(`${FUNCTIONS_BASE}/connections`, ({ request }) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const targetProject = projectId || getCurrentProject(db, result.user.id)?.id;
    if (!targetProject) return notFound('Project not found');
    const connections = getProjectConnections(db, targetProject);
    saveDatabase(db);
    return jsonResponse({ connections });
  }),

  http.put(`${FUNCTIONS_BASE}/connections`, async ({ request }) => {
    const body = await parseJson<{ connections: ConnectionRecord['connections']; projectId?: string }>(request);
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const targetProject = body.projectId || getCurrentProject(db, result.user.id)?.id;
    if (!targetProject) return notFound('Project not found');

    const record = db.connections.find((c) => c.projectId === targetProject);
    if (record) {
      record.connections = body.connections;
    } else {
      db.connections.push({ projectId: targetProject, connections: body.connections });
    }
    saveDatabase(db);
    return jsonResponse({ connections: body.connections });
  }),

  // Templates
  http.get(`${FUNCTIONS_BASE}/templates`, ({ request }) => {
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const project = getCurrentProject(db, result.user.id);
    if (!project) return notFound('Project not found');
    const items = db.templates.filter((template) => template.projectId === project.id);
    return jsonResponse({ templates: items });
  }),

  http.post(`${FUNCTIONS_BASE}/templates`, async ({ request }) => {
    const payload = await parseJson<Omit<TemplateRecord, 'id' | 'createdAt' | 'projectId'>>(request);
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const project = getCurrentProject(db, result.user.id);
    if (!project) return notFound('Project not found');
    const template: TemplateRecord = {
      id: crypto.randomUUID(),
      projectId: project.id,
      createdAt: new Date().toISOString(),
      ...payload,
    };
    db.templates.push(template);
    saveDatabase(db);
    return jsonResponse({ template });
  }),

  http.delete(`${FUNCTIONS_BASE}/templates/:templateId`, ({ params, request }) => {
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const before = db.templates.length;
    db.templates = db.templates.filter((template) => template.id !== params.templateId);
    if (db.templates.length === before) return notFound('Template not found');
    saveDatabase(db);
    return jsonResponse({ success: true });
  }),

  // Automations
  http.get(`${FUNCTIONS_BASE}/automations`, ({ request }) => {
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const project = getCurrentProject(db, result.user.id);
    if (!project) return notFound('Project not found');
    const items = db.automations.filter((automation) => automation.projectId === project.id);
    return jsonResponse({ automations: items });
  }),

  http.post(`${FUNCTIONS_BASE}/automations`, async ({ request }) => {
    const payload = await parseJson<Omit<AutomationRecord, 'id' | 'createdAt' | 'projectId'>>(request);
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const project = getCurrentProject(db, result.user.id);
    if (!project) return notFound('Project not found');
    const automation: AutomationRecord = {
      id: crypto.randomUUID(),
      projectId: project.id,
      createdAt: new Date().toISOString(),
      ...payload,
    };
    db.automations.push(automation);
    saveDatabase(db);
    return jsonResponse({ automation });
  }),

  http.put(`${FUNCTIONS_BASE}/automations/:automationId`, async ({ params, request }) => {
    const updates = await parseJson<Partial<AutomationRecord>>(request);
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const idx = db.automations.findIndex((automation) => automation.id === params.automationId);
    if (idx === -1) return notFound('Automation not found');
    db.automations[idx] = { ...db.automations[idx], ...updates };
    saveDatabase(db);
    return jsonResponse({ automation: db.automations[idx] });
  }),

  http.delete(`${FUNCTIONS_BASE}/automations/:automationId`, ({ params, request }) => {
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const before = db.automations.length;
    db.automations = db.automations.filter((automation) => automation.id !== params.automationId);
    if (db.automations.length === before) return notFound('Automation not found');
    saveDatabase(db);
    return jsonResponse({ success: true });
  }),

  // Settings
  http.get(`${FUNCTIONS_BASE}/settings`, ({ request }) => {
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const settings = db.settings.find((setting) => setting.userId === result.user.id);
    return jsonResponse({
      settings: settings ?? {
        theme: 'dark',
        notifications: { email: true, push: true, inApp: true },
        timezone: 'America/Los_Angeles',
        language: 'en',
      },
    });
  }),

  http.put(`${FUNCTIONS_BASE}/settings`, async ({ request }) => {
    const updates = await parseJson<Partial<SettingsRecord['notifications']> & Partial<SettingsRecord>>(request);
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const existing = db.settings.find((setting) => setting.userId === result.user.id);
    if (existing) {
      Object.assign(existing, updates);
    } else {
      db.settings.push({
        userId: result.user.id,
        theme: 'dark',
        notifications: { email: true, push: true, inApp: true },
        timezone: 'America/Los_Angeles',
        language: 'en',
        ...(updates as Partial<SettingsRecord>),
      });
    }
    saveDatabase(db);
    return jsonResponse({ settings: db.settings.find((s) => s.userId === result.user.id) });
  }),

  // Analytics
  http.get(`${FUNCTIONS_BASE}/analytics`, ({ request }) => {
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const project = getCurrentProject(db, result.user.id);
    if (!project) return notFound('Project not found');
    const posts = db.posts.filter((post) => post.projectId === project.id);
    return jsonResponse({ analytics: summarizeAnalytics(posts) });
  }),

  // Trending
  http.get(`${FUNCTIONS_BASE}/trending`, ({ request }) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    if (!projectId) {
      return jsonResponse({ posts: [] });
    }
    const posts = getTrendingSamples(projectId);
    return jsonResponse({ posts });
  }),

  // Inbox
  http.get(`${FUNCTIONS_BASE}/inbox`, ({ request }) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    const project = projectId || getCurrentProject(db, result.user.id)?.id;
    if (!project) return notFound('Project not found');
    const messages = db.inbox.filter((msg) => msg.projectId === project);
    return jsonResponse({ messages });
  }),

  http.post(`${FUNCTIONS_BASE}/inbox/reply`, async ({ request }) => {
    const body = await parseJson<{ messageId: string; reply: string; projectId: string }>(request);
    const { result } = requireAuth(request);
    if (!result) return unauthorized();
    return jsonResponse({ success: true, reply: { id: crypto.randomUUID(), ...body } });
  }),

  http.post(`${FUNCTIONS_BASE}/inbox/mark-read`, async ({ request }) => {
    const body = await parseJson<{ messageId: string; projectId: string }>(request);
    const { db, result } = requireAuth(request);
    if (!result) return unauthorized();
    db.inbox = db.inbox.map((message) =>
      message.id === body.messageId ? { ...message, isRead: true } : message,
    );
    saveDatabase(db);
    return jsonResponse({ success: true });
  }),

  // AI / Chat endpoints
  http.post(`${FUNCTIONS_BASE}/ai/chat`, async ({ request }) => {
    const body = await parseJson<{ messages: Array<{ role: string; content: string }> }>(request);
    const reply = body.messages?.[body.messages.length - 1]?.content ?? 'How can I assist you today?';
    return jsonResponse({
      reply: `Here's a smart suggestion based on "${reply}": repurpose this into a carousel + short-form video.`,
    });
  }),

  http.post(`${FUNCTIONS_BASE}/ai/generate-text`, async ({ request }) => {
    const body = await parseJson<{ topic: string }>(request);
    return jsonResponse({
      content: `Here’s an AI-generated script about "${body.topic}". 1) Hook your audience with a bold statement 2) Share a personal insight 3) Wrap with a CTA.`,
    });
  }),

  // Uploads (mock URLs)
  http.post(`${FUNCTIONS_BASE}/upload/profile-picture`, async ({ request }) => {
    await request.formData();
    return jsonResponse({
      url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=facearea&w=400&h=400&q=80',
      path: 'profile/demo-user',
    });
  }),

  http.post(`${FUNCTIONS_BASE}/upload/project-logo/:projectId`, async ({ request }) => {
    await request.formData();
    return jsonResponse({
      url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=400&q=80',
      path: 'projects/logo',
    });
  }),

  // OAuth mock endpoints
  http.get(`${FUNCTIONS_BASE}/oauth/authorize/:platform`, ({ params }) => {
    return jsonResponse({
      authUrl: `https://auth.demo/${params.platform}`,
      state: crypto.randomUUID(),
    });
  }),

  http.post(`${FUNCTIONS_BASE}/oauth/callback`, () => {
    return jsonResponse({
      success: true,
      accountName: '@demo-account',
    });
  }),

  http.post(`${FUNCTIONS_BASE}/oauth/disconnect`, () => jsonResponse({ success: true })),
  http.get(`${FUNCTIONS_BASE}/oauth/token/:platform/:projectId`, ({ params }) =>
    jsonResponse({
      platform: params.platform,
      projectId: params.projectId,
      accessToken: crypto.randomUUID(),
      refreshToken: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    }),
  ),

  // Notifications / activity feed
  http.get(`${FUNCTIONS_BASE}/notifications`, () =>
    jsonResponse({
      notifications: [
        {
          id: crypto.randomUUID(),
          title: 'New mention on Twitter',
          body: '@contentos shouted out your latest thread.',
          timestamp: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          title: 'Draft reminder',
          body: 'Your scheduled LinkedIn post needs approval.',
          timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
        },
      ],
    }),
  ),

  // Default catch-all for functions
  http.all(`${FUNCTIONS_BASE}/:path*`, () =>
    HttpResponse.json(
      { error: 'Not implemented in demo API' },
      { status: 501, headers: corsHeaders },
    ),
  ),
];

