import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Send cookies with requests
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add token from localStorage if exists
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ========== AUTH API ==========

export const authAPI = {
    signup: (data: { name: string; email: string; password: string; role?: string }) =>
        api.post('/auth/signup', data),

    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),

    logout: () => api.post('/auth/logout'),

    getCurrentUser: () => api.get('/auth/me'),

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
        api.post('/auth/change-password', data),
};

// ========== DASHBOARD API ==========

export const dashboardAPI = {
    getDashboard: (baseCurrency: string = 'USD') =>
        api.get('/dashboard', { params: { base: baseCurrency } }),

    getHeatmap: (baseCurrency: string = 'USD') =>
        api.get('/dashboard/heatmap', { params: { base: baseCurrency } }),

    getStats: () => api.get('/dashboard/stats'),
};

// ========== CONVERTER API ==========

export const converterAPI = {
    convert: (from: string, to: string, amount: number) =>
        api.get('/converter', { params: { from, to, amount } }),
};

// ========== HISTORICAL DATA API ==========

export const historicalAPI = {
    getHistoricalData: (currencyPair: string, period: '24h' | '1w' | '6m' | '1y') =>
        api.get(`/historical/${currencyPair}`, { params: { period } }),
};

// ========== PORTFOLIO API ==========

export const portfolioAPI = {
    getPortfolio: () => api.get('/portfolio'),

    addToPortfolio: (data: { currency: string; amount: number; purchasePrice: number }) =>
        api.post('/portfolio', data),

    updateHolding: (id: string, data: { amount: number }) =>
        api.put(`/portfolio/${id}`, data),

    deleteHolding: (id: string) => api.delete(`/portfolio/${id}`),

    getAnalytics: () => api.get('/portfolio/analytics'),
};

// ========== ALERTS API ==========

export const alertsAPI = {
    getAlerts: () => api.get('/alerts'),

    createAlert: (data: {
        currencyPair: string;
        conditionType: string;
        targetValue: number;
    }) => api.post('/alerts', data),

    deleteAlert: (id: string) => api.delete(`/alerts/${id}`),
};

// ========== NEWS API ==========

export const newsAPI = {
    getNews: (params?: { currencyPair?: string; sentiment?: string; limit?: number }) =>
        api.get('/news', { params }),

    fetchNews: () => api.post('/news/fetch'),
};

// ========== PREDICTIONS API ==========

export const predictionsAPI = {
    getPrediction: (currencyPair: string) => api.get(`/predictions/${currencyPair}`),

    getAllPredictions: (limit: number = 10) =>
        api.get('/predictions', { params: { limit } }),
};

// ========== CURRENCIES API ==========

export const currenciesAPI = {
    getCurrencies: () => api.get('/currencies'),
};

// ========== ADMIN API ==========

export const adminAPI = {
    getUsers: (page: number = 1, limit: number = 20) =>
        api.get('/admin/users', { params: { page, limit } }),

    updateUserRole: (userId: string, role: string) =>
        api.put(`/admin/users/${userId}/role`, { role }),

    toggleBan: (userId: string, banned: boolean) =>
        api.put(`/admin/users/${userId}/ban`, { banned }),

    getFailedLogins: (limit: number = 50) =>
        api.get('/admin/failed-logins', { params: { limit } }),

    getSystemStats: () => api.get('/admin/stats'),

    getAPIHealth: () => api.get('/admin/health'),
};

export default api;
