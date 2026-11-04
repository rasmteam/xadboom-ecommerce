import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // The browser talks to one origin: /api/* is proxied to the Nest API, so session cookies need no CORS.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default config;
