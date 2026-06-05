import axios from 'axios';

if (typeof window !== 'undefined') {
  axios.defaults.withCredentials = true;
}

export const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If running locally (localhost, 127.0.0.1, or local network IP like 192.168.x.x), 
    // dynamically point to the same hostname on backend port 5000.
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return `http://${hostname}:5000`;
    }
  }
  return 'http://localhost:5000';
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
