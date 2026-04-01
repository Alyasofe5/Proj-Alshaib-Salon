/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'export', // Disabled for fast local development and flexibility during edits
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
    experimental: {
        optimizePackageImports: ['lucide-react'],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
