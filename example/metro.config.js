// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add the parent directory (SDK) to watchFolders so Metro can resolve it
config.watchFolders = [
  path.resolve(__dirname, '..'),
];

// Configure resolver to handle the local package
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    '@truconsent/consent-banner-react-native': path.resolve(__dirname, '..', 'src'),
  },
  sourceExts: [...config.resolver.sourceExts, 'ts', 'tsx'],
  nodeModulesPaths: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, '..', 'node_modules'),
  ],
};

module.exports = config;
