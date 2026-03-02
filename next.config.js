/** @type {import('next').NextConfig} */
const nextConfig = {
    allowedDevOrigins: ['cine-ticket.onrender.com'],

    async rewrites() {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        return [
            {
                source: '/api-backend/:path*',
                destination: `${backendUrl}/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
