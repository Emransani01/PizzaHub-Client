import type { NextConfig } from "next";

const apiUrl = (process.env.API_URL ?? "http://localhost:5000").replace(
  /\/+$/,
  "",
);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Every dashboard page is an interactive client component rendered behind a
    // session-aware layout, so automatic instant-navigation validation can only
    // ever observe the "Checking your access" shell. Validate explicitly with
    // `export const instant` on routes that are ready for it instead.
    instantInsights: { validationLevel: "manual-warning" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "ibb.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    // Keeping the API on the same origin means the Better Auth session cookie
    // is first-party, so OAuth callbacks and cookie refreshes just work.
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
