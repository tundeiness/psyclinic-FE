/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces .next/standalone for a small production Docker runtime.
  output: "standalone",
};

module.exports = nextConfig;
