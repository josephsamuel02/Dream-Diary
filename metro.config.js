const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add support for TypeScript files
config.resolver.sourceExts.push('ts', 'tsx');

module.exports = withNativeWind(config, { input: './global.css' });
