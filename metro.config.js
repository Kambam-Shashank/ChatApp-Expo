// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Ensure .cjs files are recognized for Firebase
  config.resolver.sourceExts.push('cjs');

  // Disable package.json exports (Expo SDK 53 hazard)
  config.resolver.unstable_enablePackageExports = false;

  return config;
})();
