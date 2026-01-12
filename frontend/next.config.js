/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        return [
            {
                source: '/api/:path*',
                destination: apiUrl.replace('/api', '') + '/:path*',
            },
        ];
    },
    images: {
        domains: ['localhost'],
    },
};

module.exports = nextConfig;
