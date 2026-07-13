const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * Fix: @gluestack-ui/core → @react-aria/utils → require("react-dom")
 *
 * react-dom là thư viện web-only, không tồn tại trong React Native.
 * Metro sẽ resolve "react-dom" sang shim rỗng để tránh crash khi bundle.
 */
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
    'react-dom': path.resolve(__dirname, 'shims/react-dom.js'),
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
