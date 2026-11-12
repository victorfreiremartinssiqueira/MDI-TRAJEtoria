/**
 * TRAJEtória - Metro configuration.
 * expo-sqlite (web) requires .wasm asset support and cross-origin isolation.
 * See https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#web-setup
 */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

const originalEnhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, metroServer) => {
  const nextMiddleware = originalEnhanceMiddleware
    ? originalEnhanceMiddleware(middleware, metroServer)
    : middleware;

  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return nextMiddleware(req, res, next);
  };
};

module.exports = config;
