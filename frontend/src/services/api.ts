const BASE_URL = 'http://localhost:8080/api/v1';

export const tokenStore = {
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  },
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },
  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, headers = {}, ...rest } = options;
  
  const finalHeaders = new Headers(headers);
  if (!skipAuth) {
    const token = tokenStore.getAccessToken();
    if (token) {
      finalHeaders.set('Authorization', `Bearer ${token}`);
    }
    const viewContext = localStorage.getItem('view_context') || 'PERSONAL';
    finalHeaders.set('X-View-Context', viewContext);
  }
  if (!finalHeaders.has('Content-Type') && rest.body) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
  });

  if (response.status === 401 && !skipAuth) {
    // Attempt token refresh
    try {
      const newTokens = await refreshTokens();
      // Retry request with new token
      finalHeaders.set('Authorization', `Bearer ${newTokens.accessToken}`);
      const retryResponse = await fetch(url, {
        ...rest,
        headers: finalHeaders,
      });
      return handleResponse<T>(retryResponse);
    } catch (refreshError) {
      tokenStore.clearTokens();
      window.dispatchEvent(new Event('auth-expired'));
      throw refreshError;
    }
  }

  return handleResponse<T>(response);
}

async function refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    throw new Error('Refresh failed');
  }

  const data = await res.json() as { accessToken: string; refreshToken: string };
  tokenStore.setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw {
      code: errorBody.code || 'HTTP_ERROR',
      message: errorBody.message || `HTTP error ${res.status}`,
      errors: errorBody.errors,
      status: res.status,
    };
  }
  if (res.status === 204) {
    return null as unknown as T;
  }
  return res.json() as Promise<T>;
}
