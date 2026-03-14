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
  experimental: {
    optimizePackageImports: ["@radix-ui/react-*", "date-fns"],
    staticGenerationRetryCount: 1,
  },
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "async",
          minSize: 20000,
          maxSize: 244000,
        },
      };
    }
    return config;
  },
};

export default nextConfig;
