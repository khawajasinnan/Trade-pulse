/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: process.env.NEXT_PUBLIC_API_URL + '/:path*',
            },
        ];
    },
    images: {
        domains: ['localhost'],
    },
};

module.exports = nextConfig;
