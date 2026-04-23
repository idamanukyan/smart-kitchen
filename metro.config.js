const { getDefaultConfig } = require('@expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force Metro to resolve .js (CJS) before .mjs (ESM) for zustand.
// Zustand's ESM build uses import.meta.env which breaks in non-module scripts.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    // Redirect ESM imports to CJS
    const cjsPath = moduleName === 'zustand'
      ? path.resolve(__dirname, 'node_modules/zustand/index.js')
      : path.resolve(__dirname, 'node_modules', moduleName + '.js');

    try {
      require.resolve(cjsPath);
      return { type: 'sourceFile', filePath: cjsPath };
    } catch {
      // Fall through to default resolution
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
