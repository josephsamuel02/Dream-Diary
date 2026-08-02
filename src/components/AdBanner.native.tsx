import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { canShowBannerImpression, getBannerUnitId } from '~/util/ads';

let nativeAdsModule: { BannerAd?: any; BannerAdSize?: any } | null = null;

function getNativeAdsModule() {
  if (nativeAdsModule) return nativeAdsModule;

  try {
    nativeAdsModule = require('react-native-google-mobile-ads');
  } catch (error) {
    console.warn('Google Mobile Ads SDK is unavailable in this native build:', error);
    nativeAdsModule = null;
  }

  return nativeAdsModule;
}

export default function AdBanner() {
  const [visible, setVisible] = useState(false);
  const ads = getNativeAdsModule();

  useEffect(() => {
    let mounted = true;

    canShowBannerImpression()
      .then((eligible) => {
        if (mounted) setVisible(eligible);
      })
      .catch((error) => {
        console.warn('AdMob banner eligibility check failed:', error);
        if (mounted) setVisible(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!visible || !ads?.BannerAd || !ads?.BannerAdSize) return null;

  const BannerAd = ads.BannerAd;
  const BannerAdSize = ads.BannerAdSize;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={getBannerUnitId()}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={(error: unknown) => console.warn('AdMob banner failed to load:', error)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
    minHeight: 50,
  },
});
