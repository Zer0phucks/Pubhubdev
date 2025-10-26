import { projectId, publicAnonKey } from './supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e`;

// Storage for auth token
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('pubhub_auth_token', token);
  } else {
    localStorage.removeItem('pubhub_auth_token');
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('pubhub_auth_token');
  }
  return authToken;
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Not authenticated. Please sign in first.');
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
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

  async create(post: any) {
    return apiCall('/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  },

  async update(id: string, updates: any) {
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

  async create(template: any) {
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

  async create(automation: any) {
    return apiCall('/automations', {
      method: 'POST',
      body: JSON.stringify(automation),
    });
  },

  async update(id: string, updates: any) {
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

  async update(connections: any[], projectId?: string) {
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

  async update(settings: any) {
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
    const token = getAuthToken();
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
    const token = getAuthToken();
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
