'use client';

import { useState, useEffect } from 'react';
import { useRef } from 'react';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import Card from '../../components/Card';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { historicalAPI, converterAPI } from '../../services/api.service';

export default function ChartsPage() {
    const [selectedPair, setSelectedPair] = useState('EUR/USD');
    const [timeframe, setTimeframe] = useState('1D');
    const [chartData, setChartData] = useState<any[]>([]);
    const [candlestickData, setCandlestickData] = useState<any[]>([]);

    const currencyPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'];
    const timeframes = ['1D', '1W', '1M', '3M', '1Y'];

    const pollingRef = useRef<number | null>(null);

    useEffect(() => {
        // Fetch historical data when pair or timeframe changes
        fetchHistoricalData();

        // Start polling for live rate
        startPolling();

        return () => {
            stopPolling();
        };
    }, [selectedPair, timeframe]);

    const periodMap: Record<string, '24h' | '1w' | '6m' | '1y'> = {
        '1D': '24h',
        '1W': '1w',
        '1M': '6m',
        '3M': '6m',
        '1Y': '1y',
    };

    const normalizePairForAPI = (pair: string) => pair.replace('/', '-');

    const fetchHistoricalData = async () => {
        try {
            const apiPair = normalizePairForAPI(selectedPair);
            const period = periodMap[timeframe] || '1w';

            const resp = await historicalAPI.getHistoricalData(apiPair, period);

            // expected format: array with { date, close }
            const rows = resp.data || [];

            if (!rows || rows.length === 0) {
                // fallback to mock
                generateMockData();
                return;
            }

            // Build line and candlestick data sorted by date
            const lineData = rows.map((r: any, idx: number) => ({
                time: idx,
                price: parseFloat(r.close),
                label: new Date(r.date).toLocaleString(),
            }));

            const candleData = rows.map((r: any, idx: number) => ({
                time: idx,
                open: parseFloat(r.open || r.close),
                high: parseFloat(r.high || r.close),
                low: parseFloat(r.low || r.close),
                close: parseFloat(r.close),
                label: new Date(r.date).toLocaleString(),
            }));

            setChartData(lineData);
            setCandlestickData(candleData);
        } catch (error) {
            console.error('Failed to fetch historical data, using mock:', error);
            generateMockData();
        }
    };

    const startPolling = () => {
        stopPolling();
        // poll every 10 seconds
        const id = window.setInterval(async () => {
            try {
                const [from, to] = selectedPair.split('/');
                const resp = await converterAPI.convert(from, to, 1);
                const rate = resp.data?.result || resp.data?.rate || resp.data?.conversion_rate || resp.data?.result;
                const parsed = typeof rate === 'number' ? rate : parseFloat(rate);

                if (!isNaN(parsed)) {
                    appendLivePrice(parsed);
                }
            } catch (e) {
                // ignore polling errors
            }
        }, 10000);

        pollingRef.current = id;
    };

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    const appendLivePrice = (price: number) => {
        setChartData((prev) => {
            const next = [...prev, { time: prev.length, price, label: new Date().toLocaleTimeString() }];
            // keep maximum points to timeframe (e.g., 24 for 1D)
            const maxPoints = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : 30;
            return next.slice(-maxPoints);
        });

        setCandlestickData((prev) => {
            // For simplicity, push a small candlestick where open==prevClose and close==price
            const prevClose = prev.length > 0 ? prev[prev.length - 1].close : price;
            const open = prevClose;
            const close = price;
            const high = Math.max(open, close) + Math.random() * 0.0005;
            const low = Math.min(open, close) - Math.random() * 0.0005;
            const next = [...prev, { time: prev.length, open, high, low, close, label: new Date().toLocaleTimeString() }];
            const maxPoints = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : 30;
            return next.slice(-maxPoints);
        });
    };

    const generateMockData = () => {
        // Generate realistic forex data
        const dataPoints = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : 30;
        const basePrice = 1.09;

        const lineData = [];
        const candleData = [];
        let currentPrice = basePrice;

        for (let i = 0; i < dataPoints; i++) {
            const change = (Math.random() - 0.5) * 0.005; // ±0.5%
            currentPrice += change;

            const open = currentPrice;
            const close = currentPrice + (Math.random() - 0.5) * 0.003;
            const high = Math.max(open, close) + Math.random() * 0.002;
            const low = Math.min(open, close) - Math.random() * 0.002;

            lineData.push({
                time: i,
                price: parseFloat(currentPrice.toFixed(5)),
                label: timeframe === '1D' ? `${i}:00` : `Day ${i + 1}`,
            });

            candleData.push({
                time: i,
                open: parseFloat(open.toFixed(5)),
                high: parseFloat(high.toFixed(5)),
                low: parseFloat(low.toFixed(5)),
                close: parseFloat(close.toFixed(5)),
                label: timeframe === '1D' ? `${i}:00` : `Day ${i + 1}`,
            });
        }

        setChartData(lineData);
        setCandlestickData(candleData);
    };

    const CustomCandlestick = ({ x, y, width, height, open, close, high, low }: any) => {
        const isGreen = close > open;
        const color = isGreen ? '#10b981' : '#ef4444';
        const wickX = x + width / 2;

        return (
            <g>
                {/* High-Low wick */}
                <line
                    x1={wickX}
                    y1={y}
                    x2={wickX}
                    y2={y + height}
                    stroke={color}
                    strokeWidth={1}
                />
                {/* Open-Close body */}
                <rect
                    x={x}
                    y={isGreen ? y + height * 0.3 : y + height * 0.1}
                    width={width}
                    height={height * 0.6}
                    fill={color}
                    stroke={color}
                    strokeWidth={1}
                />
            </g>
        );
    };

    const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
    const previousPrice = chartData.length > 1 ? chartData[chartData.length - 2].price : currentPrice;
    const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
    const isPositive = priceChange >= 0;

    return (
        <ProtectedRoute>
            <Navbar />
            <div className="min-h-screen pt-20 pb-12">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <div className="mb-8 animate-fade-in-down">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                            <BarChart3 className="w-10 h-10 text-primary-500" />
                            Advanced Charts
                        </h1>
                        <p className="text-gray-600">Interactive line and candlestick charts with real-time data</p>
                    </div>

                    {/* Controls */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <Card variant="glass">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Currency Pair</label>
                            <div className="flex flex-wrap gap-2">
                                {currencyPairs.map((pair) => (
                                    <button
                                        key={pair}
                                        onClick={() => setSelectedPair(pair)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all currency-cursor ${selectedPair === pair
                                                ? 'bg-primary-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {pair}
                                    </button>
                                ))}
                            </div>
                        </Card>

                        <Card variant="glass">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
                            <div className="flex flex-wrap gap-2">
                                {timeframes.map((tf) => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all currency-cursor ${timeframe === tf
                                                ? 'bg-accent-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Current Price Card */}
                    <Card variant="glass" className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">{selectedPair}</p>
                                <p className="text-4xl font-bold text-gray-900">{currentPrice.toFixed(5)}</p>
                            </div>
                            <div className={`flex items-center gap-2 ${isPositive ? 'text-success' : 'text-danger'}`}>
                                {isPositive ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
                                <span className="text-2xl font-bold">
                                    {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Line Chart */}
                    <Card variant="glass" className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Price Trend</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="label"
                                    stroke="#6b7280"
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    domain={['dataMin - 0.001', 'dataMax + 0.001']}
                                    stroke="#6b7280"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => value.toFixed(5)}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                    }}
                                    formatter={(value: any) => [value.toFixed(5), 'Price']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="price"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ fill: '#10b981', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Candlestick Chart */}
                    <Card variant="glass" className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Candlestick Chart</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={candlestickData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="label"
                                    stroke="#6b7280"
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    domain={['dataMin - 0.002', 'dataMax + 0.002']}
                                    stroke="#6b7280"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => value.toFixed(5)}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                    }}
                                    content={({ payload }) => {
                                        if (!payload || payload.length === 0) return null;
                                        const data = payload[0].payload;
                                        const isGreen = data.close > data.open;
                                        return (
                                            <div className="p-3">
                                                <p className="font-semibold mb-2">{data.label}</p>
                                                <p className="text-sm">Open: {data.open.toFixed(5)}</p>
                                                <p className="text-sm">High: {data.high.toFixed(5)}</p>
                                                <p className="text-sm">Low: {data.low.toFixed(5)}</p>
                                                <p className={`text-sm font-semibold ${isGreen ? 'text-success' : 'text-danger'}`}>
                                                    Close: {data.close.toFixed(5)}
                                                </p>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar
                                    dataKey="high"
                                    shape={(props: any) => {
                                        const { x, y, width, height, payload } = props;
                                        const isGreen = payload.close > payload.open;
                                        const color = isGreen ? '#10b981' : '#ef4444';
                                        const bodyY = Math.min(payload.open, payload.close);
                                        const bodyHeight = Math.abs(payload.close - payload.open);
                                        const scale = height / (payload.high - payload.low);

                                        return (
                                            <g>
                                                {/* Wick */}
                                                <line
                                                    x1={x + width / 2}
                                                    y1={y}
                                                    x2={x + width / 2}
                                                    y2={y + height}
                                                    stroke={color}
                                                    strokeWidth={2}
                                                />
                                                {/* Body */}
                                                <rect
                                                    x={x + 2}
                                                    y={y + (payload.high - Math.max(payload.open, payload.close)) * scale}
                                                    width={Math.max(width - 4, 6)}
                                                    height={Math.max(bodyHeight * scale, 2)}
                                                    fill={color}
                                                    stroke={color}
                                                />
                                            </g>
                                        );
                                    }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="flex gap-4 mt-4 justify-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-success rounded"></div>
                                <span>Bullish (Green)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-danger rounded"></div>
                                <span>Bearish (Red)</span>
                            </div>
                        </div>
                    </Card>

                    {/* Stats */}
                    <div className="grid md:grid-cols-4 gap-6">
                        <Card variant="glass">
                            <p className="text-sm text-gray-600 mb-1">24h High</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {candlestickData.length > 0
                                    ? Math.max(...candlestickData.map((d) => d.high)).toFixed(5)
                                    : '—'}
                            </p>
                        </Card>
                        <Card variant="glass">
                            <p className="text-sm text-gray-600 mb-1">24h Low</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {candlestickData.length > 0
                                    ? Math.min(...candlestickData.map((d) => d.low)).toFixed(5)
                                    : '—'}
                            </p>
                        </Card>
                        <Card variant="glass">
                            <p className="text-sm text-gray-600 mb-1">Avg Price</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {candlestickData.length > 0
                                    ? (
                                        candlestickData.reduce((sum, d) => sum + d.close, 0) /
                                        candlestickData.length
                                    ).toFixed(5)
                                    : '—'}
                            </p>
                        </Card>
                        <Card variant="glass">
                            <p className="text-sm text-gray-600 mb-1">Volatility</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {candlestickData.length > 0
                                    ? (
                                        ((Math.max(...candlestickData.map((d) => d.high)) -
                                            Math.min(...candlestickData.map((d) => d.low))) /
                                            Math.min(...candlestickData.map((d) => d.low))) *
                                        100
                                    ).toFixed(2) + '%'
                                    : '—'}
                            </p>
                        </Card>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
