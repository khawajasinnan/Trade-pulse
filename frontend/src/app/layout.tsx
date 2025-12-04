import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'

const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'Trade-Pulse | AI-Powered Financial Analytics Platform',
    description: 'Real-time forex data, ML predictions, sentiment analysis, and portfolio tracking. Powered by LSTM neural networks for accurate forex forecasting.',
    keywords: 'forex, trading, AI predictions, sentiment analysis, portfolio tracking, financial analytics',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    )
}
