import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Turbopack is the default in Next.js 16
  turbopack: {},
  // Ensure Prisma client is properly transpiled
  transpilePackages: ['@prisma/client', '.prisma/client'],
};

export default nextConfig;
