import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds for now
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds for now
    ignoreBuildErrors: true,
  },
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@aws-amplify/ui-react', 'lucide-react'],
  },
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Compression
  compress: true,
  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // Cache GraphQL queries with network-first strategy
    {
      urlPattern: /^https:\/\/.*\.appsync-api\..*\.amazonaws\.com\/graphql$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'graphql-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 300, // 5 minutes
        },
        plugins: [
          {
            // Create cache key based on GraphQL query and variables
            cacheKeyWillBeUsed: async ({ request }) => {
              try {
                if (request.method === 'POST') {
                  const bodyText = await request.clone().text();
                  const { query, variables } = JSON.parse(bodyText || '{}');
                  return `${request.url}|${query}|${JSON.stringify(variables)}`;
                }
              } catch (_) {
                // If parsing fails, fall back to default behavior
              }
              return request.url;
            },
          },
        ],
        cacheableResponse: {
          statuses: [0, 200],
        },
        networkTimeoutSeconds: 10,
      },
    },
    // Cache static assets with cache-first strategy
    {
      urlPattern: /\.(?:js|css|woff|woff2|ttf|eot|ico|png|jpg|jpeg|svg|gif|webp|avif)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 86400 * 30, // 30 days
        },
      },
    },
    // Cache API routes with network-first strategy
    {
      urlPattern: /^https:\/\/.*\.execute-api\..*\.amazonaws\.com\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 300, // 5 minutes
        },
        networkTimeoutSeconds: 10,
      },
    },
    // Cache images with cache-first strategy
    {
      urlPattern: /^https:\/\/.*\.s3\..*\.amazonaws\.com\/.*$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 86400 * 7, // 7 days
        },
      },
    },
  ],
  fallbacks: {
    document: '/offline',
  },
  // Workbox options are now handled by the individual configuration above
});

export default pwaConfig(nextConfig);