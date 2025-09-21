// Client API local pour remplacer Supabase
const API_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:3001/api' 
  : '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
      throw new Error(error.error || 'Erreur inconnue');
    }

    return response.json();
  }

  // Authentification
  async register(email: string, password: string, username?: string, fullName?: string) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username, fullName }),
    });

    if (data.token) {
      this.token = data.token;
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.token) {
      this.token = data.token;
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  // Contenu
  async getContent(params: {
    type?: string;
    genre?: string;
    search?: string;
    limit?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    return this.request(`/content?${queryParams}`);
  }

  async getContentById(id: string) {
    return this.request(`/content/${id}`);
  }

  async getTrendingContent() {
    return this.request('/content/trending');
  }

  async getNewReleases() {
    return this.request('/content/new');
  }

  async getFeaturedContent() {
    return this.request('/content/featured');
  }

  // Favoris
  async getFavorites() {
    return this.request('/favorites');
  }

  async addToFavorites(contentId: string) {
    return this.request('/favorites', {
      method: 'POST',
      body: JSON.stringify({ content_id: contentId }),
    });
  }

  async removeFromFavorites(contentId: string) {
    return this.request(`/favorites/${contentId}`, {
      method: 'DELETE',
    });
  }

  // Historique de visionnage
  async getWatchHistory() {
    return this.request('/watch-history');
  }

  async addToWatchHistory(contentId: string, progressSeconds?: number, completed?: boolean) {
    return this.request('/watch-history', {
      method: 'POST',
      body: JSON.stringify({
        content_id: contentId,
        progress_seconds: progressSeconds,
        completed: completed,
      }),
    });
  }
}

export const apiClient = new ApiClient();