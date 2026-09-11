/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: "/authority",
        destination: "/dashboard/authority",
        permanent: false,
      },
      {
        source: "/citizen",
        destination: "/dashboard/citizen",
        permanent: false,
      },
      {
        source: "/rescue",
        destination: "/dashboard/rescue",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
