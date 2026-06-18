/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, nextRuntime }) => {
    // The Edge/Worker bundle must never include Node.js-only modules.
    // better-sqlite3 and the dev-only sqlite backend are used only during
    // local `next dev` (Node.js runtime), never in Cloudflare Workers.
    if (nextRuntime === 'edge') {
      config.resolve.alias = {
        ...config.resolve.alias,
        'better-sqlite3': false,
        'lib/sqlite-dev': false,
      };
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      os: false,
      stream: false,
      util: false,
      url: false,
      http: false,
      https: false,
      net: false,
      tls: false,
      zlib: false,
      assert: false,
      child_process: false,
      dns: false,
    };

    if (isServer) {
      config.externals = [...(config.externals || []), 'better-sqlite3'];
    }

    return config;
  },
  serverExternalPackages: ['better-sqlite3'],
};

module.exports = nextConfig;
