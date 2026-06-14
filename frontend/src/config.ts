const isLocalhost = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.startsWith('172.');

const getBackendHost = () => {
  if (isLocalhost) {
    // Dynamically target local server using current browser hostname (handles localhost and local Wi-Fi IPs)
    return `http://${window.location.hostname}:5000`;
  }
  return import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || window.location.origin;
};

export const SOCKET_URL = getBackendHost().replace(/\/$/, '');
export const API_URL = `${SOCKET_URL}/api`;
