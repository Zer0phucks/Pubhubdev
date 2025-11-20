import type { Platform, PostStatus } from '@/types';

const DB_KEY = 'pubhub_demo_db_v1';

export interface UserRecord {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
  profilePicture?: string | null;
  currentProjectId?: string;
}

export interface SessionRecord {
  token: string;
  refreshToken: string;
  userId: string;
  expiresAt: number;
}

export interface ProjectRecord {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
  logo?: string | null;
  logoPath?: string | null;
}

export interface PostRecord {
  id: string;
  projectId: string;
  content: string;
  status: PostStatus;
  platforms: Platform[];
  scheduledFor?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: Array<{ name: string; size: number; type: string }>;
}

export interface TemplateRecord {
  id: string;
  projectId: string;
  title: string;
  category: string;
  content: string;
  platforms: Platform[];
  createdAt: string;
}

export interface AutomationRecord {
  id: string;
  projectId: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  createdAt: string;
}

export interface ConnectionRecord {
  projectId: string;
  connections: Array<{
    platform: Platform;
    connected: boolean;
    accountName?: string;
    accountId?: string;
  }>;
}

export interface SettingsRecord {
  userId: string;
  theme: 'dark' | 'light';
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  timezone: string;
  language: string;
}

export interface InboxMessageRecord {
  id: string;
  projectId: string;
  platform: Platform;
  type: 'comment' | 'message' | 'mention';
  from: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  avatar?: string;
  postContext?: string;
}

export interface TrendingRecord {
  id: string;
  platform: Platform;
  title: string;
  content: string;
  engagement: number;
  author: string;
  postedAt: string;
  previewImage?: string;
}

export interface MockDatabase {
  users: UserRecord[];
  sessions: SessionRecord[];
  projects: ProjectRecord[];
  posts: PostRecord[];
  templates: TemplateRecord[];
  automations: AutomationRecord[];
  connections: ConnectionRecord[];
  settings: SettingsRecord[];
  inbox: InboxMessageRecord[];
  trending: TrendingRecord[];
}

const defaultConnections: ConnectionRecord['connections'] = [
  { platform: 'twitter', connected: true, accountName: '@pubhub_demo', accountId: 'tw-001' },
  { platform: 'instagram', connected: true, accountName: '@pubhub_demo', accountId: 'ig-001' },
  { platform: 'linkedin', connected: false },
  { platform: 'facebook', connected: true, accountName: 'PubHub', accountId: 'fb-001' },
  { platform: 'youtube', connected: false },
  { platform: 'tiktok', connected: false },
  { platform: 'pinterest', connected: false },
  { platform: 'reddit', connected: true, accountName: 'u/pubhub-demo', accountId: 'rd-001' },
  { platform: 'blog', connected: true, accountName: 'PubHub Blog', accountId: 'blog-001' },
];

function seedDatabase(): MockDatabase {
  const demoUserId = crypto.randomUUID();
  const demoProjectId = crypto.randomUUID();
  const now = new Date().toISOString();

  return {
    users: [
      {
        id: demoUserId,
        email: 'demo@pubhub.dev',
        password: 'DemoPass123!',
        name: 'Demo Creator',
        createdAt: now,
        profilePicture: null,
        currentProjectId: demoProjectId,
      },
    ],
    sessions: [],
    projects: [
      {
        id: demoProjectId,
        userId: demoUserId,
        name: 'Demo Launch Campaign',
        description: 'Multi-platform rollout plan for PubHub',
        createdAt: now,
        updatedAt: now,
        isDefault: true,
        logo: null,
        logoPath: null,
      },
    ],
    posts: [
      {
        id: crypto.randomUUID(),
        projectId: demoProjectId,
        content: 'PubHub saves me 10+ hours/week! Here’s how we repurpose one video into 9 posts. #contentrepurposing',
        status: 'published',
        platforms: ['twitter', 'instagram'],
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        projectId: demoProjectId,
        content: 'New long-form blog on “AI workflows for solo creators” drops tomorrow.',
        status: 'scheduled',
        platforms: ['blog', 'linkedin'],
        scheduledFor: new Date(Date.now() + 86400000).toISOString(),
        createdAt: now,
        updatedAt: now,
      },
    ],
    templates: [
      {
        id: crypto.randomUUID(),
        projectId: demoProjectId,
        title: 'Product Launch Teaser',
        category: 'promotional',
        content: '🚀 Launching {product} soon!\n\n🎯 Who it’s for: {audience}\n✨ Why it matters: {benefit}\n\nDrop a comment if you want early access!',
        platforms: ['twitter', 'linkedin'],
        createdAt: now,
      },
    ],
    automations: [
      {
        id: crypto.randomUUID(),
        projectId: demoProjectId,
        name: 'Repurpose YouTube uploads to LinkedIn',
        trigger: 'youtube_upload',
        action: 'create_linkedin_post',
        enabled: true,
        createdAt: now,
      },
    ],
    connections: [
      {
        projectId: demoProjectId,
        connections: structuredClone(defaultConnections),
      },
    ],
    settings: [
      {
        userId: demoUserId,
        theme: 'dark',
        notifications: {
          email: true,
          push: true,
          inApp: true,
        },
        timezone: 'America/Los_Angeles',
        language: 'en',
      },
    ],
    inbox: [
      {
        id: crypto.randomUUID(),
        projectId: demoProjectId,
        platform: 'instagram',
        type: 'comment',
        from: 'content_ally',
        content: 'Love this carousel! Did you design it in Figma?',
        timestamp: now,
        isRead: false,
        avatar: 'https://i.pravatar.cc/80?img=12',
        postContext: 'AI Content Planner carousel',
      },
    ],
    trending: [
      {
        id: crypto.randomUUID(),
        platform: 'twitter',
        title: 'Creators are automating their content teams',
        content: 'Solo creators are building “mini agencies” powered by AI + automation. Here’s the stack the best are using 👇',
        engagement: 8431,
        author: '@mariehq',
        postedAt: now,
      },
      {
        id: crypto.randomUUID(),
        platform: 'instagram',
        title: 'Short-form storytelling frameworks',
        content: 'Carousels that feel like mini documentaries. Study these 5 creators doing it right →',
        engagement: 12654,
        author: '@studioflow',
        postedAt: now,
      },
    ],
  };
}

export function loadDatabase(): MockDatabase {
  if (typeof window === 'undefined') {
    return seedDatabase();
  }

  const existing = localStorage.getItem(DB_KEY);
  if (!existing) {
    const seeded = seedDatabase();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    return JSON.parse(existing) as MockDatabase;
  } catch {
    const seeded = seedDatabase();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

export function saveDatabase(db: MockDatabase) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function resetDatabase() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DB_KEY);
}

export function ensureUserProject(db: MockDatabase, userId: string) {
  const hasProject = db.projects.some((p) => p.userId === userId);
  if (hasProject) return db;

  const now = new Date().toISOString();
  const projectId = crypto.randomUUID();
  db.projects.push({
    id: projectId,
    userId,
    name: 'My First Project',
    description: 'Auto-created project',
    createdAt: now,
    updatedAt: now,
    isDefault: true,
  });

  db.connections.push({
    projectId,
    connections: structuredClone(defaultConnections),
  });

  db.users = db.users.map((u) =>
    u.id === userId ? { ...u, currentProjectId: projectId } : u
  );

  return db;
}

export function formatSupabaseUser(user: UserRecord) {
  const now = new Date().toISOString();
  return {
    id: user.id,
    email: user.email,
    created_at: user.createdAt,
    updated_at: now,
    phone: null,
    confirmed_at: now,
    last_sign_in_at: now,
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: {
      name: user.name,
      profilePicture: user.profilePicture ?? null,
    },
    identities: [
      {
        id: user.id,
        identity_id: user.id,
        user_id: user.id,
        identity_data: {
          email: user.email,
          sub: user.id,
        },
        provider: 'email',
        last_sign_in_at: now,
        created_at: now,
        updated_at: now,
      },
    ],
    factors: [],
    role: 'authenticated',
    aud: 'authenticated',
  };
}

export function createSession(db: MockDatabase, userId: string) {
  const token = crypto.randomUUID();
  const refreshToken = crypto.randomUUID();
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

  db.sessions = db.sessions.filter((session) => session.userId !== userId);
  db.sessions.push({
    token,
    refreshToken,
    userId,
    expiresAt,
  });

  return { token, refreshToken, expiresAt };
}

export function getUserByToken(db: MockDatabase, authHeader?: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const session = db.sessions.find((s) => s.token === token);
  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    return null;
  }

  return { user, session };
}

export function getProjectConnections(db: MockDatabase, projectId: string) {
  const record = db.connections.find((c) => c.projectId === projectId);
  if (record) return record.connections;
  const connections = structuredClone(defaultConnections);
  db.connections.push({ projectId, connections });
  return connections;
}

