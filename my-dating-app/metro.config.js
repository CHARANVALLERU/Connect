// Metro configuration for React Native
// This configuration enables proper TypeScript and React Native support

const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts }
  } = await getDefaultConfig();

  return {
    resolver: {
      extraNodeModules: {
        react: path.join(__dirname, 'node_modules/react'),
        'react-native': path.join(__dirname, 'node_modules/react-native'),
        'react-native-paper': path.join(__dirname, 'node_modules/react-native-paper'),
      },
      sourceExts: [...sourceExts, 'ts', 'tsx', 'js', 'jsx'],
      assetExts: [...assetExts, 'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp'],
    },
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg/transformer'),
    },
  };
})();