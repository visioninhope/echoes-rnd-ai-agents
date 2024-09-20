import "./src/app/env.mjs";
import withPWAInit from "@ducanh2912/next-pwa";
import CopyPlugin from "copy-webpack-plugin"

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // appDir: true,
    // serverActions: true,
  },
  images: {
    domains: [
      "oaidalleapiprodscus.blob.core.windows.net",
      "echoes-images.s3.ap-south-1.amazonaws.com",
      "d7ftvotrexusa.cloudfront.net",
      "api.projectpq.ai",
    ],
  },
  redirects: async () => {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    config.resolve.extensions.push(".ts", ".js",".mjs", ".tsx")
    config.resolve.fallback = { fs: false }
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: "./node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js",
            to: "static/chunks/app/vad.worklet.bundle.min.js",
          },
          {
            from: "./node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js",
            to: "static/chunks/app/vad.worklet.bundle.min.js",
          },
          {
            from: "./node_modules/@ricky0123/vad-web/dist/silero_vad.onnx",
            to: "static/chunks/app/silero_vad.onnx",

          },
          { from: "./node_modules/onnxruntime-web/dist/*", to: "static/chunks/app/[name][ext]" },
          {
            from: "./node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js",
            to: "static/chunks/app/dashboard/chat/[chatid]/vad.worklet.bundle.min.js",
          },
          {
            from: "./node_modules/@ricky0123/vad-web/dist/silero_vad.onnx",
            to: "static/chunks/app/dashboard/chat/[chatid]/silero_vad.onnx",

          },
          { from: "./node_modules/onnxruntime-web/dist/*", to: "static/chunks/app/dashboard/chat/[chatid]/[name][ext]" },
        ],
      })
    )

    return config
  }
};

export default withPWA(nextConfig);

// export default Sentry.withSentryConfig(nextConfig, {authToken: process.env.SENTRY_AUTH_TOKEN, org: process.env.SENTRY_ORG, project: process.env.SENTRY_PROJECT, hideSourceMaps: true},  {
// // For all available options, see:
// // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

// // Upload a larger set of source maps for prettier stack traces (increases build time)
// widenClientFileUpload: true,

// // Transpiles SDK to be compatible with IE11 (increases bundle size)
// transpileClientSDK: true,

// // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
// tunnelRoute: "/monitoring",

// // Hides source maps from generated client bundles
// hideSourceMaps: true,

// // Automatically tree-shake Sentry logger statements to reduce bundle size
// disableLogger: true,
// });
