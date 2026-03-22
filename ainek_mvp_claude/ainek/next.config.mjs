/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Allow camera access in development
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Permissions-Policy", value: "camera=*" },
        ],
      },
    ];
  },
};

export default nextConfig;
