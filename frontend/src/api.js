import axios from 'axios';
import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/^http/, 'ws');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
    } catch (err) {
        console.warn('Failed to attach auth token:', err);
    }
    return config;
});

// Handle 401 responses by redirecting to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Session expired or invalid — redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const getStatus = () => api.get('/status');
export const getClusters = () => api.get('/clusters');
export const semanticSearch = (query) => api.post('/search', { query });
export const askAI = (query) => api.post('/ask', { query });
export const triggerRecluster = () => api.post('/recluster');

export const getWebSocketUrl = () => `${WS_BASE_URL}/ws`;

export default api;
