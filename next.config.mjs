/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: process.cwd(),
  },
  staticPageGenerationTimeout: 60,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 60s
    pagesBufferLength: 5,
  },
  // Optimizaciones para caché y performance
  swcMinify: true,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@radix-ui/react-*", "date-fns", "lucide-react"],
    staticGenerationRetryCount: 1,
    // Optimizar fonts
    optimizeCss: true,
    // Mejorar tiempo de compilación
    turbo: {
      resolveAlias: {
        "@/*": "./src/*",
      },
    },
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
            // Vendor chunk para dependencias comunes
            vendor: {
              name: "vendor",
              chunks: "all",
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
