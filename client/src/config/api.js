
// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
// Base server URL for uploads and other resources
export const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';
export default API_BASE_URL;
