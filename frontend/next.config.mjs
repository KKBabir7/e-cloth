/** @type {import('next').NextConfig} */
const nextConfig = {
  // Swiper 9+ is ESM-only; transpile it so Next.js can bundle it for SSR prerendering
  transpilePackages: ['swiper', 'ssr-window', 'dom7'],
  experimental: {
    optimizePackageImports: ['react-icons', 'react-bootstrap']
  }
};

export default nextConfig;
