'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const { signup, isAuthenticated, loading: authLoading } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); // Keep confirmPassword separate
    const [role, setRole] = useState<'BasicUser' | 'Trader' | 'Admin'>('BasicUser');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, authLoading, router]);

    const passwordRequirements = [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
        { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
        { label: 'Contains number', met: /\d/.test(password) },
        { label: 'Contains special character', met: /[@$!%*&]/.test(password) },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password requirements
        if (!passwordRequirements.every((req) => req.met)) {
            setError('Password does not meet all requirements');
            return;
        }

        setLoading(true);

        try {
            await signup(name, email, password, role);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-full mb-4">
                        <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Join Trade-Pulse</h1>
                    <p className="text-gray-600 mt-2">Start your financial analytics journey</p>
                </div>

                {/* Signup Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>

                    {error && (
                        <div className="mb-4 p-4 bg-danger-light/20 border border-danger rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-danger">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                                Account Type
                            </label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'BasicUser' | 'Trader')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                            >
                                <option value="BasicUser">Basic User - Essential tools</option>
                                <option value="Trader">Trader - Advanced analytics</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                You can upgrade your account type later
                            </p>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                    placeholder="••••••••"
                                />
                            </div>

                            {/* Password Requirements */}
                            {password && (
                                <div className="mt-2 space-y-1">
                                    {passwordRequirements.map((req, index) => (
                                        <div key={index} className="flex items-center gap-2 text-xs">
                                            {req.met ? (
                                                <CheckCircle className="w-4 h-4 text-success" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                            )}
                                            <span className={req.met ? 'text-success' : 'text-gray-500'}>
                                                {req.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl currency-cursor"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-sm text-gray-500">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
