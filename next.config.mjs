/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Cloudflare Pages configuration
  trailingSlash: true,
  // Output configuration for static deployment
  output: 'export',
  distDir: 'out',
}

export default nextConfig
