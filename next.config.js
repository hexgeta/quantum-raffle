/** @type {import('next').NextConfig} */
const nextConfig = {
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
