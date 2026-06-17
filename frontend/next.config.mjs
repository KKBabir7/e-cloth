/** @type {import('next').NextConfig} */
const nextConfig = {
  // Swiper 9+ is ESM-only; transpile it so Next.js can bundle it for SSR prerendering
  transpilePackages: ['swiper', 'ssr-window', 'dom7'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '5000', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '5000', pathname: '/**' }
    ]
  },
  experimental: {
    optimizePackageImports: ['react-icons', 'react-bootstrap']
  }
};

export default nextConfig;
