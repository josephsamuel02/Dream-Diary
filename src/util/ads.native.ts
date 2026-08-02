import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const BANNER_IMPRESSION_KEY = 'dream-diary:banner-impressions';
const INTERSTITIAL_COOLDOWN_KEY = 'dream-diary:interstitial-cooldown';

let initialized = false;
let nativeAdsModule: any = null;

const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function getNativeAdsModule() {
  if (IS_EXPO_GO) {
    console.warn('Google Mobile Ads is not available in Expo Go. Run a development build (npx expo run:android) to see ads.');
    return null;
  }
  if (nativeAdsModule) return nativeAdsModule;

  try {
    nativeAdsModule = require('react-native-google-mobile-ads');
  } catch (error) {
    console.warn('Google Mobile Ads native module is unavailable:', error);
    nativeAdsModule = null;
  }

  return nativeAdsModule;
}

function configuredUnitIdOrFallback(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  if (!normalized) return fallback;
  if (normalized.includes('your-publisher-id')) return fallback;
  return normalized;
}

function isDevelopmentMode(): boolean {
  return __DEV__;
}

function coerceNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function coerceProbability(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0, parsed));
}

const FALLBACK_TEST_IDS: Record<string, string> = {
  APP_OPEN: 'ca-app-pub-3940256099942544/9257395921',
  ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/9214589741',
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  REWARDED_INTERSTITIAL: 'ca-app-pub-3940256099942544/5354046379',
  NATIVE: 'ca-app-pub-3940256099942544/2247696110',
};

function getTestIds() {
  return getNativeAdsModule()?.TestIds ?? null;
}

export function getBannerUnitId(): string {
  const testIds = getTestIds();
  if (isDevelopmentMode()) {
    return testIds?.BANNER || FALLBACK_TEST_IDS.BANNER;
  }
  return configuredUnitIdOrFallback(
    process.env.EXPO_PUBLIC_ADMOB_BANNER_ID,
    testIds?.BANNER || FALLBACK_TEST_IDS.BANNER
  );
}

export function getInterstitialUnitId(): string {
  const testIds = getTestIds();
  if (isDevelopmentMode()) {
    return testIds?.INTERSTITIAL || FALLBACK_TEST_IDS.INTERSTITIAL;
  }
  return configuredUnitIdOrFallback(
    process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID,
    testIds?.INTERSTITIAL || FALLBACK_TEST_IDS.INTERSTITIAL
  );
}

export function getRewardedThemeUnitId(): string {
  const testIds = getTestIds();
  if (isDevelopmentMode()) {
    return testIds?.REWARDED || FALLBACK_TEST_IDS.REWARDED;
  }
  return configuredUnitIdOrFallback(
    process.env.EXPO_PUBLIC_ADMOB_REWARDED_THEME_ID,
    testIds?.REWARDED || FALLBACK_TEST_IDS.REWARDED
  );
}

export function getRewardedBackgroundUnitId(): string {
  const testIds = getTestIds();
  if (isDevelopmentMode()) {
    return testIds?.REWARDED_INTERSTITIAL || FALLBACK_TEST_IDS.REWARDED_INTERSTITIAL;
  }
  return configuredUnitIdOrFallback(
    process.env.EXPO_PUBLIC_ADMOB_REWARDED_BACKGROUND_ID,
    testIds?.REWARDED_INTERSTITIAL || FALLBACK_TEST_IDS.REWARDED_INTERSTITIAL
  );
}

export async function initializeAds(): Promise<void> {
  if (initialized) return;

  const ads = getNativeAdsModule();
  if (!ads?.AdsConsent || !ads?.mobileAds) {
    console.warn('[AdMob] Native ads SDK unavailable; skipping initialization');
    return;
  }

  try {
    await ads.AdsConsent.gatherConsent();
  } catch (error) {
    console.warn('AdMob consent gathering failed:', error);
  }

  const consentInfo = await ads.AdsConsent.getConsentInfo();
  if (!consentInfo.canRequestAds) return;

  await ads.mobileAds().initialize();
  initialized = true;
}

export async function canShowBannerImpression(): Promise<boolean> {
  const maxPerDay = coerceNumber(process.env.EXPO_PUBLIC_ADMOB_BANNER_MAX_PER_DAY, 3);
  const dateKey = new Date().toISOString().slice(0, 10);

  const stored = await AsyncStorage.getItem(BANNER_IMPRESSION_KEY);
  const counters = stored ? (JSON.parse(stored) as Record<string, number>) : {};
  const currentCount = counters[dateKey] ?? 0;

  if (currentCount >= maxPerDay) {
    return false;
  }

  counters[dateKey] = currentCount + 1;
  await AsyncStorage.setItem(BANNER_IMPRESSION_KEY, JSON.stringify(counters));
  return true;
}

export async function shouldAttemptIdleInterstitial(idleSeconds: number): Promise<boolean> {
  const idleThreshold = coerceNumber(process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IDLE_SECONDS, 120);
  const cooldownMinutes = coerceNumber(
    process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_COOLDOWN_MINUTES,
    30
  );
  const probability = coerceProbability(
    process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_SHOW_PROBABILITY,
    0.25
  );

  if (idleSeconds < idleThreshold) return false;
  if (Math.random() > probability) return false;

  const cooldownMs = cooldownMinutes * 60 * 1000;
  const stored = await AsyncStorage.getItem(INTERSTITIAL_COOLDOWN_KEY);
  const lastShownAt = stored ? Number(stored) : 0;
  const now = Date.now();

  if (now - lastShownAt < cooldownMs) {
    return false;
  }

  await AsyncStorage.setItem(INTERSTITIAL_COOLDOWN_KEY, String(now));
  return true;
}

export async function showInterstitialAd(): Promise<boolean> {
  const ads = getNativeAdsModule();
  if (!ads?.InterstitialAd || !ads?.AdEventType) return false;

  const interstitial = ads.InterstitialAd.createForAdRequest(getInterstitialUnitId(), {
    requestNonPersonalizedAdsOnly: false,
  });

  await new Promise<void>((resolve, reject) => {
    const onLoaded = () => {
      cleanup();
      interstitial.show();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onClosed = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      unsubscribeLoaded();
      unsubscribeError();
      unsubscribeClosed();
    };

    const unsubscribeLoaded = interstitial.addAdEventListener(ads.AdEventType.LOADED, onLoaded);
    const unsubscribeError = interstitial.addAdEventListener(ads.AdEventType.ERROR, onError);
    const unsubscribeClosed = interstitial.addAdEventListener(ads.AdEventType.CLOSED, onClosed);
    interstitial.load();
  });

  return true;
}

async function showRewardedAd(unitId: string): Promise<boolean> {
  const ads = getNativeAdsModule();
  if (!ads) {
    console.warn('[RewardedAd] Native ads module unavailable');
    return false;
  }
  if (!ads.RewardedAd) {
    console.warn('[RewardedAd] RewardedAd not available in module');
    return false;
  }
  if (!unitId) {
    console.warn('[RewardedAd] Empty ad unit ID');
    return false;
  }

  if (__DEV__) {
    console.log(`[RewardedAd] Creating rewarded ad with unitId: ${unitId}`);
  }

  try {
    const rewardedAd = ads.RewardedAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    return await new Promise<boolean>((resolve, reject) => {
      const onLoaded = () => {
        if (__DEV__) {
          console.log('[RewardedAd] Ad loaded, showing...');
        }
        rewardedAd.show();
      };

      const onReward = () => {
        if (__DEV__) {
          console.log('[RewardedAd] User earned reward');
        }
        cleanup();
        resolve(true);
      };

      const onError = (error: Error) => {
        if (__DEV__) {
          console.warn('[RewardedAd] Error:', error.message);
        }
        cleanup();
        reject(error);
      };

      const onClosed = () => {
        if (__DEV__) {
          console.log('[RewardedAd] Ad closed without reward');
        }
        cleanup();
        resolve(false);
      };

      const cleanup = () => {
        unsubscribeLoaded();
        unsubscribeRewarded();
        unsubscribeError();
        unsubscribeClosed();
      };

      const unsubscribeLoaded = rewardedAd.addAdEventListener(
        ads.RewardedAdEventType.LOADED,
        onLoaded
      );
      const unsubscribeRewarded = rewardedAd.addAdEventListener(
        ads.RewardedAdEventType.EARNED_REWARD,
        onReward
      );
      const unsubscribeError = rewardedAd.addAdEventListener(ads.AdEventType.ERROR, onError);
      const unsubscribeClosed = rewardedAd.addAdEventListener(ads.AdEventType.CLOSED, onClosed);

      if (__DEV__) {
        console.log('[RewardedAd] Loading ad...');
      }
      rewardedAd.load();
    });
  } catch (error) {
    console.warn('[RewardedAd] Failed to create or start rewarded ad:', error);
    return false;
  }
}

export async function showRewardedThemeAd(): Promise<boolean> {
  return showRewardedAd(getRewardedThemeUnitId());
}

export async function showRewardedBackgroundAd(): Promise<boolean> {
  return showRewardedAd(getRewardedBackgroundUnitId());
}
