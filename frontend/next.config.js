const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone is required in Docker (Linux), but causes ENOENT copyfile issues on Windows local dev
  output: process.platform === 'win32' ? undefined : 'standalone',
  experimental: {
    externalDir: true, // allows importing ../shared
    outputFileTracingRoot: path.join(__dirname, '..'), // standalone output mirrors the repo layout
  },
};

module.exports = nextConfig;
