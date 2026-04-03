// //const BACKEND_URL = import.meta.env.VITE_API_URL 
// //  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
// //  : 'http://localhost:5000';
// const BACKEND_URL = '';
// const BASE = '/api';

// //const BASE = `${BACKEND_URL}/api`;
// /// <reference types="vite/client" />

// // Ensure VITE_API_URL is read safely
// //onst API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// // Remove trailing slash if present
// //const BASE = API_URL.replace(/\/$/, '');

// function getToken(): string | null {
//   return localStorage.getItem('token');
// }

// // Common response handler
// async function handleResponse<T>(res: Response): Promise<T> {
//   if (res.status === 401) {
//     handleUnauthorized();
//     throw new Error('Unauthorized');
//   }

//   if (!res.ok) {
//     const err = await res.json().catch(() => ({ message: 'Request failed' }));
//     throw new Error(err.message || 'Request failed');
//   }

//   return res.json() as Promise<T>;
// }

// // Standard Fetch for JSON
// export async function apiFetch<T>(
//   path: string,
//   options: RequestInit = {}
// ): Promise<T> {
//   const token = getToken();
//   const cleanPath = path.startsWith('/') ? path : `/${path}`;

//   const res = await fetch(`${BASE}${cleanPath}`, {
//     ...options,
//     headers: {
//       'Content-Type': 'application/json',
//       // 👇 FIXED: Uses ternary operator to prevent spreading boolean/null
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       // 👇 FIXED: Falls back to empty object if no custom headers are passed
//       ...(options.headers || {}),
//     },
//   });

//   return handleResponse<T>(res);
// }

// // File Upload (multipart/form-data)
// export async function apiUpload<T>(
//   path: string,
//   formData: FormData
// ): Promise<T> {
//   const token = getToken();
//   const cleanPath = path.startsWith('/') ? path : `/${path}`;

//   const res = await fetch(`${BASE}${cleanPath}`, {
//     method: 'POST',
//     headers: {
//       // 👇 FIXED: Applied the exact same safe spread here!
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       // Do NOT set Content-Type manually
//     },
//     body: formData,
//   });

//   return handleResponse<T>(res);
// }

// // Profile Image URL
// export function getProfilePicUrl(
//   filename: string | null | undefined
// ): string | null {
//   if (!filename) return null;

//   // remove /api if present
//   const backend = BASE.replace(/\/api$/, '');

//   return `${backend}/uploads/profiles/${filename}`;
// }

// // Handle unauthorized globally
// function handleUnauthorized() {
//   localStorage.removeItem('token');
//   localStorage.removeItem('user');

//   if (window.location.pathname !== '/login') {
//     window.location.href = '/login';
//   }
// }
/// <reference types="vite/client" />

// 🔥 1. The Smart URL Router for API Fetching
// Defaults to your local backend port 5000 during development.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Remove trailing slash if present to prevent double slashes
const BASE = API_URL.replace(/\/$/, '');

function getToken(): string | null {
  return localStorage.getItem('token');
}

// Common response handler
async function handleResponse<T>(res: Response): Promise<T> {
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

// Standard Fetch for JSON
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  const res = await fetch(`${BASE}${cleanPath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Uses ternary operator to prevent spreading boolean/null which crashes TypeScript
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Falls back to empty object if no custom headers are passed
      ...(options.headers || {}),
    },
  });

  return handleResponse<T>(res);
}

// File Upload (multipart/form-data)
export async function apiUpload<T>(
  path: string,
  formData: FormData
): Promise<T> {
  const token = getToken();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  const res = await fetch(`${BASE}${cleanPath}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Do NOT set Content-Type manually here; browser sets it automatically for FormData
    },
    body: formData,
  });

  return handleResponse<T>(res);
}

// 🔥 2. The Bulletproof Image Helper
export function getProfilePicUrl(
  filename: string | null | undefined
): string | null {
  if (!filename) return null;

  // If it's already a full Google/LinkedIn URL, let it pass
  if (filename.startsWith('http')) return filename;

  // Vite's built-in tool: true if you are running 'npm run dev'
  const isDev = import.meta.env.DEV; 
  
  // Force localhost:5000 during dev. 
  // In production, it cleanly strips '/api' from your backend URL.
  const backendUrl = isDev ? 'http://localhost:5000' : BASE.replace(/\/api$/, '');

  // Clean the filename just in case the DB saved the folder path
  const cleanFilename = filename.replace(/^\/?uploads\/profiles\//, '');

  return `${backendUrl}/uploads/profiles/${cleanFilename}`;
}

// Handle unauthorized globally
function handleUnauthorized() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}