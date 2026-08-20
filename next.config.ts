import type { NextConfig } from "next";

const BLOG_URL = "https://bywilliaml.substack.com/archive";

const nextConfig: NextConfig = {
  output: "standalone",
  // Plain 301s, not `permanent: true`. `permanent` emits a 308, and Next adds a
  // `Refresh` header alongside 308 for IE11 — link scanners on social platforms
  // read a Refresh header as a client-side bounce. A bare 301 is the oldest and
  // most universally understood redirect, so every crawler resolves it cleanly.
  async redirects() {
    return [
      { source: "/blog", destination: BLOG_URL, statusCode: 301 },
      // Catches /blog/anything so deep links land on the archive instead of 404.
      { source: "/blog/:path*", destination: BLOG_URL, statusCode: 301 },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
