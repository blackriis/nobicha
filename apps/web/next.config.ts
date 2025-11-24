import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@employee-management/config', '@employee-management/database', '@employee-management/ui'],
  turbopack: {
    resolveAlias: {
      '@employee-management/config': '../../packages/config',
      '@employee-management/database': '../../packages/database',
      '@employee-management/ui': '../../packages/ui',
    },
  },
  // Fix workspace root warning
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // Disable generation of static 404/500 pages to prevent prerender errors
  // Vercel will handle error pages at runtime
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
};

export default nextConfig;
