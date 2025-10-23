import nextPWA from 'next-pwa';

// Workbox runtime caching rules
const runtimeCaching = [
  // Supabase APIs (Auth, REST, Storage, etc.)
  {
    urlPattern: /^https?:\/\/[^/]*supabase\.co\/.*$/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'supabase-cache',
      networkTimeoutSeconds: 10,
      expiration: {
        maxEntries: 300,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  // Images
  {
    urlPattern: ({ request }) => request.destination === 'image',
    handler: 'CacheFirst',
    options: {
      cacheName: 'image-cache',
      expiration: {
        maxEntries: 300,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prefer modern image formats
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

const withPWA = nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching,
});

let withBundleAnalyzer = (config) => config
if (process.env.ANALYZE === 'true') {
  try {
    const mod = await import('@next/bundle-analyzer')
    withBundleAnalyzer = mod.default({ enabled: true })
  } catch (e) {
    // analyzer not installed; ignore
  }
}

export default withPWA(withBundleAnalyzer(nextConfig));
