/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  pageExtensions: ["ts", "tsx"],
  experimental: {
    forceSwcTransforms: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "buzingbee.com" },
      { protocol: "https", hostname: "api.buzingbee.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      {
        protocol: "https",
        hostname: "pub-c140e4fa124a41a6b58ef5638192bafc.r2.dev",
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp4|webm|ogg)$/i,
      type: "asset/resource",
    });

    return config;
  },
};

module.exports = nextConfig;
