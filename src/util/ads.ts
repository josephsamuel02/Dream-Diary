// Web builds do not include the native Google Mobile Ads SDK.
export async function initializeAds(): Promise<void> {}

export function getBannerUnitId(): string {
  return '';
}

export function getInterstitialUnitId(): string {
  return '';
}

export function getRewardedThemeUnitId(): string {
  return '';
}

export function getRewardedBackgroundUnitId(): string {
  return '';
}

export async function canShowBannerImpression(): Promise<boolean> {
  return false;
}

export async function shouldAttemptIdleInterstitial(_idleSeconds: number): Promise<boolean> {
  return false;
}

export async function showInterstitialAd(): Promise<boolean> {
  return false;
}

export async function showRewardedThemeAd(): Promise<boolean> {
  return false;
}

export async function showRewardedBackgroundAd(): Promise<boolean> {
  return false;
}
