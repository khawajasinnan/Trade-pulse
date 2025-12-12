'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';
import { Newspaper, TrendingUp, TrendingDown, ThumbsUp, ThumbsDown, Minus, Calendar } from 'lucide-react';

interface NewsItem {
    id: string;
    title: string;
    source: string;
    publishedAt: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    impact: string[];
    summary: string;
}

export default function SentimentPage() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');

    useEffect(() => {
        fetchSentiment();
    }, []);

    const fetchSentiment = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/sentiment?limit=20`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch sentiment data');
            }

            const data = await response.json();
            setNews(data.news || []);
        } catch (error) {
            console.error('Error fetching sentiment:', error);
            // Fallback to empty array on error
            setNews([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredNews = filter === 'all' ? news : news.filter((item) => item.sentiment === filter);

    const sentimentStats = {
        positive: news.filter((n) => n.sentiment === 'positive').length,
        negative: news.filter((n) => n.sentiment === 'negative').length,
        neutral: news.filter((n) => n.sentiment === 'neutral').length,
    };

    const averageSentiment =
        news.reduce((sum, item) => sum + item.score, 0) / news.length;

    return (
        <ProtectedRoute>
            <Navbar />
            <div className="min-h-screen pt-20 pb-12">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <div className="mb-8 animate-fade-in-down">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                            <Newspaper className="w-10 h-10 text-primary-500" />
                            Sentiment Analysis
                        </h1>
                        <p className="text-gray-600">Financial news analysis with AI-powered sentiment scoring</p>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-success-light/30 rounded-lg flex items-center justify-center">
                                    <ThumbsUp className="w-6 h-6 text-success" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Positive</p>
                                    <p className="text-2xl font-bold text-success">{sentimentStats.positive}</p>
                                </div>
                            </div>
                        </Card>

                        <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-danger-light/30 rounded-lg flex items-center justify-center">
                                    <ThumbsDown className="w-6 h-6 text-danger" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Negative</p>
                                    <p className="text-2xl font-bold text-danger">{sentimentStats.negative}</p>
                                </div>
                            </div>
                        </Card>

                        <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-neutral-light/30 rounded-lg flex items-center justify-center">
                                    <Minus className="w-6 h-6 text-neutral" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Neutral</p>
                                    <p className="text-2xl font-bold text-neutral">{sentimentStats.neutral}</p>
                                </div>
                            </div>
                        </Card>

                        <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${averageSentiment > 0 ? 'bg-success-light/30' : 'bg-danger-light/30'
                                    }`}>
                                    {averageSentiment > 0 ? (
                                        <TrendingUp className="w-6 h-6 text-success" />
                                    ) : (
                                        <TrendingDown className="w-6 h-6 text-danger" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Avg Score</p>
                                    <p className={`text-2xl font-bold ${averageSentiment > 0 ? 'text-success' : 'text-danger'
                                        }`}>
                                        {averageSentiment.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Filter Buttons */}
                    <Card variant="glass" className="mb-6 animate-fade-in-up">
                        <div className="flex flex-wrap gap-3">
                            {(['all', 'positive', 'negative', 'neutral'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all capitalize currency-cursor ${filter === f
                                        ? 'bg-primary-500 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}}
                        </div>
                    </Card>

                    {/* News Feed */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredNews.map((item, index) => (
                                <Card
                                    key={item.id}
                                    variant="glass"
                                    className="animate-fade-in-up"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Sentiment Icon */}
                                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${item.sentiment === 'positive'
                                            ? 'bg-success-light/30'
                                            : item.sentiment === 'negative'
                                                ? 'bg-danger-light/30'
                                                : 'bg-neutral-light/30'
                                            }`}>
                                            {item.sentiment === 'positive' ? (
                                                <ThumbsUp className="w-8 h-8 text-success" />
                                            ) : item.sentiment === 'negative' ? (
                                                <ThumbsDown className="w-8 h-8 text-danger" />
                                            ) : (
                                                <Minus className="w-8 h-8 text-neutral" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                                                <SentimentScore score={item.score} sentiment={item.sentiment} />
                                            </div>

                                            <p className="text-gray-700 mb-3">{item.summary}</p>

                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                                <span className="font-medium">{item.source}</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(item.publishedAt).toLocaleDateString()}
                                                </span>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.impact.map((currency) => (
                                                        <span
                                                            key={currency}
                                                            className="px-2 py-1 bg-accent-100 text-accent-700 rounded text-xs font-medium"
                                                        >
                                                            {currency}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}

function SentimentScore({ score, sentiment }: { score: number; sentiment: string }) {
    const percentage = Math.abs(score * 100);

    return (
        <div className="flex items-center gap-2">
            <div className="text-right">
                <p className="text-xs text-gray-600">Score</p>
                <p className={`text-lg font-bold ${sentiment === 'positive' ? 'text-success' : sentiment === 'negative' ? 'text-danger' : 'text-neutral'
                    }`}>
                    {score > 0 ? '+' : ''}{score.toFixed(2)}
                </p>
            </div>
            <div className="w-20 bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all ${sentiment === 'positive' ? 'bg-success' : sentiment === 'negative' ? 'bg-danger' : 'bg-neutral'
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
