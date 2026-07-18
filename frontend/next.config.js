
const path = require("path");

const nextConfig = {
  reactStrictMode: true,

  turbopack: {
    root: path.join(__dirname),
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  },
};

module.exports = nextConfig;
