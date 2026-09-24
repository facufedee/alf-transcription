const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // required by the Dockerfile
  experimental: {
    externalDir: true, // allows importing ../shared
    outputFileTracingRoot: path.join(__dirname, '..'), // standalone output mirrors the repo layout
  },
};

module.exports = nextConfig;
