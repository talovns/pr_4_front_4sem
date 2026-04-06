import axios from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../auth/storage';

const BASE_URL = 'http://localhost:3000/api';

const authClient = axios.create({ baseURL: BASE_URL });

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken();
        if (accessToken) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error?.response?.status;

        if (!originalRequest || status !== 401) {
            return Promise.reject(error);
        }

        // Do not try to refresh if we're already refreshing
        if (String(originalRequest.url || '').includes('/auth/refresh')) {
            clearTokens();
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            return Promise.reject(error);
        }
        originalRequest._retry = true;

        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            clearTokens();
            return Promise.reject(error);
        }

        try {
            const refreshResponse = await authClient.post(
                '/auth/refresh',
                null,
                { headers: { 'x-refresh-token': refreshToken } }
            );

            const tokens = refreshResponse.data;
            setTokens(tokens);

            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return apiClient(originalRequest);
        } catch (refreshError) {
            clearTokens();
            return Promise.reject(refreshError);
        }
    }
);

export const api = {
    register: (payload) => authClient.post('/auth/register', payload).then((res) => res.data),
    login: (payload) => authClient.post('/auth/login', payload).then((res) => res.data),
    me: () => apiClient.get('/auth/me').then((res) => res.data),

    getProducts: () => apiClient.get('/products').then((res) => res.data),
    createProduct: (product) => apiClient.post('/products', product).then((res) => res.data),
    getProductById: (id) => apiClient.get(`/products/${id}`).then((res) => res.data),
    updateProduct: (id, product) => apiClient.put(`/products/${id}`, product).then((res) => res.data),
    patchProduct: (id, product) => apiClient.patch(`/products/${id}`, product).then((res) => res.data),
    deleteProduct: (id) => apiClient.delete(`/products/${id}`),

    // Admin: users management
    getUsers: () => apiClient.get('/users').then((res) => res.data),
    getUserById: (id) => apiClient.get(`/users/${id}`).then((res) => res.data),
    updateUser: (id, payload) => apiClient.put(`/users/${id}`, payload).then((res) => res.data),
    blockUser: (id) => apiClient.delete(`/users/${id}`),
};