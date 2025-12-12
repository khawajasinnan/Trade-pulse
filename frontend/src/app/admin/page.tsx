'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
    Shield,
    Users,
    Activity,
    AlertTriangle,
    TrendingUp,
    Database,
    RefreshCw,
    Search,
    Ban,
    CheckCircle,
    XCircle
} from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'BasicUser' | 'Trader' | 'Admin';
    banned: boolean;
    createdAt: string;
    lastLoginAt: string | null;
}

interface SystemStats {
    totalUsers: number;
    activeUsers: number;
    bannedUsers: number;
    totalPredictions: number;
    failedLogins: number;
}

export default function AdminPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('all');

    useEffect(() => {
        // Check if user is Admin
        if (user && user.role !== 'Admin') {
            router.push('/dashboard');
        }
    }, [user, router]);

    useEffect(() => {
        if (user?.role === 'Admin') {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch users
            const usersRes = await fetch('/api/admin/users', {
                credentials: 'include',
            });
            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data.users || []);
            }

            // Fetch stats
            const statsRes = await fetch('/api/admin/stats', {
                credentials: 'include',
            });
            if (statsRes.ok) {
                const data = await statsRes.json();
                // Transform backend response to match frontend expectations
                setStats({
                    totalUsers: data.users?.total || 0,
                    activeUsers: data.users?.active || 0,
                    bannedUsers: data.users?.banned || 0,
                    totalPredictions: data.data?.predictions || 0,
                    failedLogins: data.activity?.failedLoginAttempts || 0,
                });
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ role: newRole }),
            });

            if (res.ok) {
                // Refresh data
                fetchData();
            }
        } catch (error) {
            console.error('Error changing role:', error);
        }
    };

    const handleBanToggle = async (userId: string, banned: boolean) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/ban`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ banned: !banned }),
            });

            if (res.ok) {
                // Refresh data
                fetchData();
            }
        } catch (error) {
            console.error('Error toggling ban:', error);
        }
    };

    // Filter users
    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole === 'all' || u.role === selectedRole;
        return matchesSearch && matchesRole;
    });

    // Prevent non-admin access
    if (user?.role !== 'Admin') {
        return null;
    }

    return (
        <ProtectedRoute>
            <Navbar />
            <div className="min-h-screen pt-20 pb-12 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <div className="mb-8 animate-fade-in-down">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                            <Shield className="w-10 h-10 text-purple-600" />
                            Admin Panel
                        </h1>
                        <p className="text-gray-600">System administration and user management</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                        <>
                            {/* Stats Cards */}
                            <div className="grid md:grid-cols-4 gap-6 mb-8">
                                <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Users className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Total Users</p>
                                            <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-success-light/30 rounded-lg flex items-center justify-center">
                                            <Activity className="w-6 h-6 text-success" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Active Users</p>
                                            <p className="text-2xl font-bold text-success">{stats?.activeUsers || 0}</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-danger-light/30 rounded-lg flex items-center justify-center">
                                            <AlertTriangle className="w-6 h-6 text-danger" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Failed Logins</p>
                                            <p className="text-2xl font-bold text-danger">{stats?.failedLogins || 0}</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <Database className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Predictions</p>
                                            <p className="text-2xl font-bold text-gray-900">{stats?.totalPredictions || 0}</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Users Table */}
                            <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                                <div className="p-6">
                                    {/* Table Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                            <Users className="w-6 h-6" />
                                            Users Management
                                        </h2>
                                        <button
                                            onClick={fetchData}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors currency-cursor"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Refresh
                                        </button>
                                    </div>

                                    {/* Filters */}
                                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by name or email..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                        <select
                                            value={selectedRole}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        >
                                            <option value="all">All Roles</option>
                                            <option value="BasicUser">Basic User</option>
                                            <option value="Trader">Trader</option>
                                            <option value="Admin">Admin</option>
                                        </select>
                                    </div>

                                    {/* Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Login</th>
                                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredUsers.map((u) => (
                                                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                                        <td className="py-3 px-4">
                                                            <div>
                                                                <div className="font-medium text-gray-900">{u.name}</div>
                                                                <div className="text-sm text-gray-500">{u.email}</div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <select
                                                                value={u.role}
                                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                                className={`px-3 py-1 rounded-lg text-sm font-semibold border-none ${u.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                                                    u.role === 'Trader' ? 'bg-blue-100 text-blue-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                                    }`}
                                                                disabled={u.role === 'Admin'}
                                                            >
                                                                <option value="BasicUser">Basic User</option>
                                                                <option value="Trader">Trader</option>
                                                                <option value="Admin">Admin</option>
                                                            </select>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold ${u.banned
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                {u.banned ? (
                                                                    <><XCircle className="w-4 h-4" /> Banned</>
                                                                ) : (
                                                                    <><CheckCircle className="w-4 h-4" /> Active</>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-gray-600">
                                                            {u.lastLoginAt
                                                                ? new Date(u.lastLoginAt).toLocaleDateString()
                                                                : 'Never'}
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <button
                                                                onClick={() => handleBanToggle(u.id, u.banned)}
                                                                disabled={u.role === 'Admin'}
                                                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors currency-cursor ${u.role === 'Admin'
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : u.banned
                                                                        ? 'bg-success-light/30 text-success hover:bg-success-light/50'
                                                                        : 'bg-danger-light/30 text-danger hover:bg-danger-light/50'
                                                                    }`}
                                                            >
                                                                {u.banned ? 'Unban' : 'Ban'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {filteredUsers.length === 0 && (
                                        <div className="text-center py-12 text-gray-500">
                                            No users found matching your criteria
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
