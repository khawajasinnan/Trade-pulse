'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api.service';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'BasicUser' | 'Trader' | 'Admin';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string, role?: string) => Promise<any>;
    logout: () => Promise<void>;
    loginWithToken: (token: string) => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isTrader: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const response = await authAPI.getCurrentUser();
                setUser(response.data.user);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await authAPI.login({ email, password });
            const { user, token } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Login failed');
        }
    };

    const loginWithToken = async (token: string) => {
        try {
            localStorage.setItem('token', token);
            const response = await authAPI.getCurrentUser();
            setUser(response.data.user);
        } catch (error) {
            console.error('loginWithToken failed', error);
            // Fall back to clearing token if check fails
            localStorage.removeItem('token');
            setUser(null);
        }
    };

    const signup = async (name: string, email: string, password: string, role?: string) => {
        try {
            const response = await authAPI.signup({ name, email, password, role: role || 'BasicUser' });
            const { user, token } = response.data;
            // Set token and user locally
            if (token) {
                localStorage.setItem('token', token);
            }
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
            }
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || error.message || 'Signup failed');
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    const value = {
        user,
        loading,
        login,
        signup,
        logout,
        loginWithToken,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'Admin',
        isTrader: user?.role === 'Trader' || user?.role === 'Admin',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
