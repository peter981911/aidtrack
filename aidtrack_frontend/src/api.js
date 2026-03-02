import axios from 'axios';

const api = axios.create({
    baseURL: 'https://aidtrack.onrender.com/api',
});

// Request Interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('aidtrack_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`; // Add Bearer token
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
