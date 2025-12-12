'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import Card from '../../components/Card';
import { User, Mail, Shield, Key, Bell, Save } from 'lucide-react';

export default function ProfilePage() {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [notifications, setNotifications] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        setTimeout(() => {
            setSaving(false);
            alert('Profile updated successfully!');
        }, 1000);
    };

    return (
        <ProtectedRoute>
            <Navbar />
            <div className="min-h-screen pt-20 pb-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    {/* Header */}
                    <div className="mb-8 animate-fade-in-down">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                            <User className="w-10 h-10 text-primary-500" />
                            Profile Settings
                        </h1>
                        <p className="text-gray-600">Manage your account settings and preferences</p>
                    </div>

                    <div className="grid gap-6">
                        {/* Profile Info */}
                        <Card variant="glass" className="animate-fade-in-up">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Personal Information
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="input"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role
                                    </label>
                                    <div className="px-4 py-3 bg-gray-100 rounded-lg font-medium text-gray-700">
                                        {user?.role}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Security */}
                        <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Security
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Preferences */}
                        <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                Preferences
                            </h2>
                            <div className="space-y-4">
                                <label className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                    <div className="flex items-center gap-3">
                                        <Bell className="w-5 h-5 text-gray-600" />
                                        <div>
                                            <p className="font-medium text-gray-900">Email Notifications</p>
                                            <p className="text-sm text-gray-600">Receive updates about your portfolio</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={notifications}
                                        onChange={(e) => setNotifications(e.target.checked)}
                                        className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                                    />
                                </label>
                            </div>
                        </Card>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 currency-cursor"
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
