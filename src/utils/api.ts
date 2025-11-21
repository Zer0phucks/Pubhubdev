import type {
  PostPayload,
  TemplatePayload,
  AutomationPayload,
  ConnectionPayload,
  SettingsPayload,
  ApiResponse
} from '../types';

// DigitalOcean API URL - should be set via environment variable
// Format: https://your-api-service.ondigitalocean.app
// If no API URL is set, use relative path (assumes API is on same domain)
const FALLBACK_API_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '';
export const API_URL = FALLBACK_API_URL;

// Storage for auth token
let authToken: string | null = null;
let authTokenProvider: (() => Promise<string | null>) | null = null;
const isBrowser = typeof window !== 'undefined';

export function setAuthToken(token: string | null) {
  authToken = token;
  if (!isBrowser) {
    return;
  }
  if (token) {
    localStorage.setItem('pubhub_auth_token', token);
  } else {
    localStorage.removeItem('pubhub_auth_token');
  }
}

export function registerAuthTokenProvider(
  provider: (() => Promise<string | null>) | null
) {
  authTokenProvider = provider;
}

export async function getAuthToken(): Promise<string | null> {
  if (authToken) {
    return authToken;
  }

  if (authTokenProvider) {
    return authTokenProvider();
  }

  if (isBrowser && !authToken) {
    authToken = localStorage.getItem('pubhub_auth_token');
  }

  return authToken;
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Not authenticated. Please sign in first.');
  }
  
  // If no API URL is configured, throw a helpful error
  if (!API_URL) {
    console.warn(`[PubHub] API call to ${endpoint} failed: No API URL configured. Set VITE_API_BASE_URL environment variable.`);
    throw new Error('API service not configured. Please set VITE_API_BASE_URL environment variable.');
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  // Ensure Authorization header is set (don't allow override)
  headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
    } catch {
      // If JSON parsing fails, try text
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch {
        // Ignore parsing errors
      }
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// ============= POSTS API =============

export const postsAPI = {
  async getAll(filters?: { status?: string; platform?: string; projectId?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.platform) params.set('platform', filters.platform);
    if (filters?.projectId) params.set('projectId', filters.projectId);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/posts${query}`);
  },

  async getById(id: string) {
    return apiCall(`/posts/${id}`);
  },

  async create(post: PostPayload) {
    return apiCall('/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  },

  async update(id: string, updates: Partial<PostPayload>) {
    return apiCall(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string) {
    return apiCall(`/posts/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============= TEMPLATES API =============

export const templatesAPI = {
  async getAll() {
    return apiCall('/templates');
  },

  async create(template: TemplatePayload) {
    return apiCall('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  },

  async delete(id: string) {
    return apiCall(`/templates/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============= AUTOMATIONS API =============

export const automationsAPI = {
  async getAll() {
    return apiCall('/automations');
  },

  async create(automation: AutomationPayload) {
    return apiCall('/automations', {
      method: 'POST',
      body: JSON.stringify(automation),
    });
  },

  async update(id: string, updates: Partial<AutomationPayload>) {
    return apiCall(`/automations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string) {
    return apiCall(`/automations/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============= CONNECTIONS API =============

export const connectionsAPI = {
  async getAll(projectId?: string) {
    const query = projectId ? `?projectId=${projectId}` : '';
    return apiCall(`/connections${query}`);
  },

  async update(connections: ConnectionPayload[], projectId?: string) {
    return apiCall('/connections', {
      method: 'PUT',
      body: JSON.stringify({ connections, projectId }),
    });
  },
};

// ============= OAUTH API =============

export const oauthAPI = {
  /**
   * Start OAuth flow for a platform
   */
  async authorize(platform: string, projectId: string) {
    return apiCall(`/oauth/authorize/${platform}?projectId=${projectId}`);
  },

  /**
   * Complete OAuth callback
   */
  async callback(code: string, state: string, platform: string) {
    return apiCall('/oauth/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state, platform }),
    });
  },

  /**
   * Disconnect a platform
   */
  async disconnect(platform: string, projectId: string) {
    return apiCall('/oauth/disconnect', {
      method: 'POST',
      body: JSON.stringify({ platform, projectId }),
    });
  },

  /**
   * Get access token for a platform
   */
  async getToken(platform: string, projectId: string) {
    return apiCall(`/oauth/token/${platform}/${projectId}`);
  },
};

// ============= SETTINGS API =============

export const settingsAPI = {
  async get() {
    return apiCall('/settings');
  },

  async update(settings: SettingsPayload) {
    return apiCall('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

// ============= ANALYTICS API =============

export const analyticsAPI = {
  async get(platform: string = 'all') {
    return apiCall(`/analytics?platform=${platform}`);
  },
};

// ============= UPLOAD API =============

export const uploadAPI = {
  async uploadProfilePicture(file: File) {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/upload/profile-picture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.json();
  },
  
  async uploadProjectLogo(projectId: string, file: File) {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/upload/project-logo/${projectId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.json();
  },
};

// ============= INBOX API =============

export const inboxAPI = {
  getMessages: (projectId: string, platform?: string) => {
    const params = new URLSearchParams({ projectId });
    if (platform) params.append('platform', platform);
    return apiCall(`/inbox?${params}`);
  },
  replyToMessage: (messageId: string, reply: string, projectId: string) => apiCall('/inbox/reply', {
    method: 'POST',
    body: JSON.stringify({ messageId, reply, projectId }),
  }),
  markAsRead: (messageId: string, projectId: string) => apiCall('/inbox/mark-read', {
    method: 'POST',
    body: JSON.stringify({ messageId, projectId }),
  }),
};

// AI Assistant API
export const aiAPI = {
  chat: async (messages: Array<{role: string; content: string}>, projectId?: string) => {
    return apiCall('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, projectId }),
    });
  },
};

// ============= TRENDING POSTS API =============

export const trendingAPI = {
  /**
   * Get trending posts from social platforms
   * @param params - Query parameters (platform, category, count)
   * @returns Trending posts with engagement metrics
   */
  async get(params: {
    platform?: string;
    category?: string;
    count?: number;
    projectId: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params.platform) queryParams.set('platform', params.platform);
    if (params.category) queryParams.set('category', params.category);
    if (params.count) queryParams.set('count', params.count.toString());
    if (params.projectId) queryParams.set('projectId', params.projectId);

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiCall(`/trending${query}`);
  },
};
