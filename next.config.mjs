/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        API_URL: process.env.API_URL
      },
    experimental: {
        serverActions: true,
      },
    images: {
    domains: ['localhost', '29c5cfdbd24c2606c1b4e6e1a8b88eb3.r2.cloudflarestorage.com'],
  },
};

export default nextConfig;
