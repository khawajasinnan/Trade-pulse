'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import {
    Home,
    LayoutDashboard,
    TrendingUp,
    Newspaper,
    Wallet,
    BarChart3,
    User,
    LogOut,
    Menu,
    X,
    Shield,
    Brain,
    ArrowLeftRight,
} from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, isAuthenticated } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (!isAuthenticated) {
        return null;
    }

    const navLinks = [
        {
            href: '/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            roles: ['BasicUser', 'Trader', 'Admin'] // Everyone can see dashboard
        },
        {
            href: '/converter',
            label: 'Converter',
            icon: ArrowLeftRight,
            roles: ['BasicUser'] // Only BasicUser can convert currency
        },
        {
            href: '/predictions',
            label: 'Predictions',
            icon: Brain,
            roles: ['Trader'] // Only Trader
        },
        {
            href: '/portfolio',
            label: 'Portfolio',
            icon: Wallet,
            roles: ['Trader'] // Only Trader
        },
        {
            href: '/sentiment',
            label: 'Sentiment',
            icon: TrendingUp,
            roles: ['Trader'] // Only Trader
        },
        {
            href: '/charts',
            label: 'Charts',
            icon: BarChart3,
            roles: ['Trader'] // Only Trader
        },
        {
            href: '/admin',
            label: 'Admin',
            icon: Shield,
            roles: ['Admin'] // Only Admin
        },
    ];

    // Filter navigation based on user role
    const filteredLinks = navLinks.filter(link =>
        user?.role && link.roles.includes(user.role)
    );

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-white/90 backdrop-blur-lg shadow-md'
                : 'bg-white/70 backdrop-blur-sm'
                }`}
        >
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-gradient-emerald rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                            <Home className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold gradient-text hidden sm:block">
                            Trade-Pulse
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {filteredLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 currency-cursor ${isActive
                                        ? 'bg-primary-500 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="font-medium text-sm">{link.label}</span>
                                </Link>
                            );
                        })}

                        {/* Direct Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 ml-2 currency-cursor"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="font-medium text-sm">Logout</span>
                        </button>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-4">
                        {/* User Dropdown */}
                        <div className="relative hidden md:block">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors currency-cursor"
                            >
                                <div className="w-8 h-8 bg-gradient-emerald rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left hidden lg:block">
                                    <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${user?.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                            user?.role === 'Trader' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {user?.role}
                                        </span>
                                    </div>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {showUserMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowUserMenu(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-fade-in-down">
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <User className="w-4 h-4 text-gray-600" />
                                            <span className="text-sm text-gray-700">Profile Settings</span>
                                        </Link>
                                        <div className="border-t border-gray-200 my-2" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors text-left"
                                        >
                                            <LogOut className="w-4 h-4 text-red-600" />
                                            <span className="text-sm text-red-600">Logout</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6 text-gray-700" />
                            ) : (
                                <Menu className="w-6 h-6 text-gray-700" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden py-4 animate-fade-in-down">
                        <div className="flex flex-col gap-2">
                            {filteredLinks.map((link) => {
                                const Icon = link.icon;
                                const isActive = pathname === link.href;

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                            ? 'bg-primary-500 text-white shadow-md'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{link.label}</span>
                                    </Link>
                                );
                            })}

                            <div className="border-t border-gray-200 my-2" />

                            <Link
                                href="/profile"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                            >
                                <User className="w-5 h-5" />
                                <span className="font-medium">Profile</span>
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all text-left"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
