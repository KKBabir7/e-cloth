import axios from 'axios';

if (typeof window !== 'undefined') {
  axios.defaults.withCredentials = true;
}

export const getBackendUrl = () => {
  // Server-side: use environment variable
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }
  // Client-side: dynamically detect localhost vs production
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return `http://${hostname}:5000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

export const getProductImageUrl = (url) => {
  if (!url) return '/images/placeholder-shirt.png';
  if (url.startsWith('http') || url.startsWith('data:')) {
    return url;
  }
  // Ensure we don't double slash
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${getBackendUrl()}${cleanUrl}`;
};
