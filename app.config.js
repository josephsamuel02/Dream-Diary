const TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const TEST_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

function configuredIdOrFallback(value, fallback) {
  return value && !value.includes('your-publisher-id') ? value : fallback;
}

module.exports = ({ config }) => {
  config.plugins = config.plugins.map((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== 'react-native-google-mobile-ads') {
      return plugin;
    }

    return [
      plugin[0],
      {
        ...plugin[1],
        androidAppId: configuredIdOrFallback(
          process.env.ADMOB_ANDROID_APP_ID || process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID,
          TEST_ANDROID_APP_ID,
        ),
        iosAppId: configuredIdOrFallback(
          process.env.ADMOB_IOS_APP_ID || process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID,
          TEST_IOS_APP_ID,
        ),
      },
    ];
  });

  return config;
};