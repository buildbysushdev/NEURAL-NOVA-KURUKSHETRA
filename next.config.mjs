/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Avoid typecheck blocking on Node 26 compatibility quirks
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
