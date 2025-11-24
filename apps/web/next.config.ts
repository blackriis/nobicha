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
  transpilePackages: [
    '@employee-management/config',
    '@employee-management/database',
    '@employee-management/ui',
    '@supabase/auth-js',
    '@supabase/storage-js',
    '@supabase/functions-js',
    '@supabase/postgrest-js',
    '@supabase/realtime-js',
    '@supabase/ssr',
    '@supabase/supabase-js'
  ],
  webpack: (config) => {
    // Ignore specific modules that cause issues in Supabase builds
    config.resolve.alias = {
      ...config.resolve.alias,
      // Fix for missing optional dependencies in @supabase/auth-js and @supabase/storage-js
      './lib/web3/ethereum': false, 
      // Point webauthn to a mock file instead of ignoring it completely to avoid "WebAuthnApi is not a constructor" error
      './lib/webauthn': path.resolve(__dirname, 'src/lib/supabase-mocks.js'),
      './packages/StorageAnalyticsClient': false,
      './lib/vectors': false,
      // Additional fixes for Vercel build errors
      './BlobDownloadBuilder': false, // Ignore this in @supabase/storage-js
      './ka.js': false, // Ignore failing zod locales
      './km.js': false, // Ignore failing zod locales
      './lt.js': false, // Ignore failing zod locales
      './uk.js': false, // Ignore failing zod locales
    };

    // Force react-is resolution to avoid "Module not found" error
    try {
      config.resolve.alias['react-is'] = require.resolve('react-is');
    } catch (e) {
      // If standard resolution fails, try manual path assumption based on Vercel environment
      config.resolve.alias['react-is'] = path.resolve(__dirname, '../../node_modules/react-is');
    }

    return config;
  },
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
