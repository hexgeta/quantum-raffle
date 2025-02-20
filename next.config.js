/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enable static exports
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true,
  distDir: 'dist',
  webpack: (config) => {
    config.externals.push("pino-pretty");
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "tfhe_bg.wasm": require.resolve("tfhe/tfhe_bg.wasm"),
      fs: false,
      net: false,
      tls: false
    };
    return config;
  },
};

module.exports = nextConfig;
