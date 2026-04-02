//const BACKEND_URL = import.meta.env.VITE_API_URL 
//  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
//  : 'http://localhost:5000';
const BACKEND_URL = '';
const BASE = '/api';

//const BASE = `${BACKEND_URL}/api`;

function getToken(): string | null {
  return localStorage.getItem('token');
}

// Standard Fetch for JSON
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  const res = await fetch(`${BASE}${cleanPath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Request failed');
  }

  return res.json() as Promise<T>;
}

// Helper for File Uploads (Multi-part)
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  const res = await fetch(`${BASE}${cleanPath}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Note: No Content-Type here; browser sets it for FormData
    },
    body: formData,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Request failed');
  }

  return res.json() as Promise<T>;
}

export function getProfilePicUrl(filename: string | null | undefined): string | null {
  return filename ? `${BACKEND_URL}/uploads/profiles/${filename}` : null;
}

function handleUnauthorized() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}