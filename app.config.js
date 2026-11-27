// Hybrid env + secrets config for Expo/EAS
module.exports = ({ config }) => {
  // Safely load local .env when available; EAS will provide process.env
  try {
    require('dotenv').config();
  } catch {}

  const base = require('./app.json');
  const env = process.env || {};

  // Utility: OS hint for env-based fallback (EAS does not provide RN Platform at config time)
  function PlatformFallbackOS(e) {
    const hint = (e.EAS_BUILD_PLATFORM || '').toLowerCase();
    if (hint === 'android') return 'android';
    return 'ios';
  }

  // Secret (not exposed at runtime): used to configure Android/iOS via library
  const googleAdsAppId = env.GOOGLE_MOBILE_ADS_APP_ID
    || (base['react-native-google-mobile-ads']?.android_app_id)
    || 'ca-app-pub-3940256099942544~3347511713';
  const iosGoogleAdsAppId = env.GOOGLE_MOBILE_ADS_IOS_APP_ID
    || (base['react-native-google-mobile-ads']?.ios_app_id)
    || 'ca-app-pub-3940256099942544~1458002511';

  // Non-secret toggle; default true
  const delayInitRaw = false;
  const delayInit = false;

  // Public runtime values: Expo exposes EXPO_PUBLIC_* to the app
  // Ads modes (EXPO_PUBLIC_ENABLE_ADS):
  //   'true'     → production AdMob ad units
  //   'test'     → Google test ad units (ads logic kept, no production traffic)
  //   'dev-only' → alias of 'test'
  //   'false'    → ads off (default; no SDK init, no requests)
  // app.json carries extra.enableAdsMode as the tracked default. It matters for
  // EAS cloud builds, where .env (gitignored) is NOT uploaded, so without it the
  // build would silently fall back to 'false'.
  const enableAdsRaw = env.EXPO_PUBLIC_ENABLE_ADS
    ?? base.expo?.extra?.enableAdsMode
    ?? base.expo?.extra?.enableAds
    ?? 'false';
  const enableAdsNorm = String(enableAdsRaw).toLowerCase();
  const isTestAdMode = enableAdsNorm === 'test' || enableAdsNorm === 'dev-only';
  const enableAds = enableAdsNorm === 'true' || isTestAdMode;
  // Production AdMob Ad Unit IDs (permanently assigned from AdMob dashboard).
  // In test mode these are intentionally NOT emitted so a stale value can never
  // leak production traffic; config/adsConfig.js resolves the Google test units.
  // Banner: iOS App ID 4295486771 → Banner Unit 7061250916
  const PROD_BANNER_ID_IOS = 'ca-app-pub-3457277467592299/7061250916';
  const PROD_BANNER_ID_ANDROID = PROD_BANNER_ID_IOS;
  // Interstitial: iOS App ID 4295486771 → Interstitial Unit 8520494517
  const PROD_INTERSTITIAL_ID_IOS = 'ca-app-pub-3457277467592299/8520494517';
  const PROD_INTERSTITIAL_ID_ANDROID = PROD_INTERSTITIAL_ID_IOS;

  const bannerAdUnitIdRaw = env.EXPO_PUBLIC_BANNER_AD_UNIT_ID
    ?? env.EXPO_PUBLIC_BANNER_AD_UNIT_ID_IOS
    ?? base.expo?.extra?.bannerAdUnitId;
  const bannerAdUnitId = bannerAdUnitIdRaw || (
    !isTestAdMode
      ? (PlatformFallbackOS(env) === 'android' ? PROD_BANNER_ID_ANDROID : PROD_BANNER_ID_IOS)
      : null
  );
  const interstitialAdUnitIdRaw = env.EXPO_PUBLIC_INTERSTITIAL_AD_UNIT_ID
    ?? env.EXPO_PUBLIC_INTERSTITIAL_AD_UNIT_ID_IOS
    ?? base.expo?.extra?.interstitialAdUnitId;
  const interstitialAdUnitId = interstitialAdUnitIdRaw || (
    !isTestAdMode
      ? (PlatformFallbackOS(env) === 'android' ? PROD_INTERSTITIAL_ID_ANDROID : PROD_INTERSTITIAL_ID_IOS)
      : null
  );

  const finalExpo = {
    ...base.expo,
    name: 'Simple-Photo-Frame',
    plugins: [
      'expo-font',
      'expo-tracking-transparency',
      [
        'expo-localization',
        {
        }
      ],
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: googleAdsAppId,
          iosAppId: iosGoogleAdsAppId,
          delayAppMeasurementInit: delayInit,
          optimizeInitialization: false,
          optimizeAdLoading: true,
          // NOTE: content-rating / age-treatment filtering is NOT settable here.
          // The Expo config plugin only supports androidAppId, iosAppId,
          // delayAppMeasurementInit, optimizeInitialization, optimizeAdLoading,
          // skAdNetworkItems and userTrackingUsageDescription. Anything else is
          // silently ignored, so do not add maxAdContentRating /
          // tagForChildDirectedTreatment / tagForUnderAgeOfConsent here: they have
          // no effect. Content rating is enforced via AdMob UI blocking controls
          // and, if ever needed in code, via mobileAds().setRequestConfiguration().
          userTrackingUsageDescription: base.expo?.ios?.infoPlist?.NSUserTrackingUsageDescription
            || 'This identifier will be used to deliver personalized ads to you.',
        },
      ],
      [
        'expo-build-properties',
        {
          ios: {
            extraPods: [
              { name: 'GoogleMobileAdsMediationUnity' },
            ],
          },
        },
      ],
      [
        'expo-plugin-app-name-localization',
        {
          localizations: {
            en: 'Simple-Photo-Frame',
            ja: 'シンプル・フォトフレーム',
            'zh-Hans': '简单照片相框',
            es: 'MarcoFotosSimple',
          },
        },
      ],
    ],
    ios: {
      ...(base.expo?.ios || {}),
      infoPlist: {
        ...(base.expo?.ios?.infoPlist || {}),
        CFBundleDisplayName: 'Simple-Photo-Frame',
        CFBundleName: 'Simple-Photo-Frame',
        LSHasLocalizedDisplayName: true,
        CFBundleLocalizations: ['en', 'ja', 'zh-Hans', 'es'],
        SKAdNetworkItems: [
          ...(base.expo?.ios?.infoPlist?.SKAdNetworkItems || []),
          { SKAdNetworkIdentifier: '424m5254sk.skadnetwork' },
        ],
      },
    },
    android: {
      ...(base.expo?.android || {}),
    },
    extra: {
      ...(base.expo?.extra || {}),
      enableAds,
      // Persist the raw mode string ('true' / 'test' / 'dev-only' / 'false') so
      // config/adsConfig.js can still detect test mode when EXPO_PUBLIC_* values
      // are not inlined into the production bundle.
      enableAdsMode: enableAdsNorm,
      bannerAdUnitId: bannerAdUnitId || null,
      interstitialAdUnitId: interstitialAdUnitId || null,
      // preserve existing EAS metadata
      eas: base.expo?.extra?.eas,
    },
  };

  return {
    ...base,
    expo: finalExpo,
  };
};