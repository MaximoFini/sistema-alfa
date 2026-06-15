/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  staticPageGenerationTimeout: 60,
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  productionBrowserSourceMaps: false,
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 60s
    pagesBufferLength: 5,
  },
  // Optimizaciones para caché y performance
  reactStrictMode: true,
  turbopack: {},
  experimental: {
    optimizePackageImports: ["@radix-ui/react-*", "date-fns", "lucide-react"],
    staticGenerationRetryCount: 1,
    // Optimizar fonts
    optimizeCss: true,
  },
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "async",
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk para dependencias comunes (solo client-side async)
            // IMPORTANTE: chunks: "async" evita incluir librerías browser-only
            // (ej: @supabase/realtime-js usa `self`) en el bundle del servidor SSR
            vendor: {
              name: "vendor",
              chunks: "async",
              test: /node_modules/,
              priority: 20,
            },
            // Chunk común para código compartido
            common: {
              name: "common",
              minChunks: 2,
              chunks: "async",
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
