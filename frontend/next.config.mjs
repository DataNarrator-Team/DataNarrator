/** @type {import('next').NextConfig} */

// Flask backend address (see backend/app.py). Override with BACKEND_URL.
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5000"

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // AI (Gemini) analysis calls can take a while
    proxyTimeout: 180000,
  },
  // Proxy every /api/* request to the Flask backend so the browser talks to
  // a single origin (no CORS setup needed on the backend).
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ]
  },
}

export default nextConfig
