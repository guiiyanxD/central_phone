/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // Optimización de memoria en compilación (Render Free Tier 512MB / VPS Low-Spec)
  experimental: {
    webpackBuildWorker: false,
    cpus: 1,
    optimizePackageImports: ['lucide-react'],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
