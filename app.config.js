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
  const enableAdsRaw = env.EXPO_PUBLIC_ENABLE_ADS ?? base.expo?.extra?.enableAds ?? 'true';
  const enableAds = String(enableAdsRaw).toLowerCase() !== 'false';
  // Production AdMob Ad Unit IDs (permanently assigned from AdMob dashboard).
  // Fallback ONLY to test IDs when EAS secrets override these explicitly to empty for local dev.
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
    (String(enableAdsRaw).toLowerCase() !== 'dev-only')
      ? (PlatformFallbackOS(env) === 'android' ? PROD_BANNER_ID_ANDROID : PROD_BANNER_ID_IOS)
      : null
  );
  const interstitialAdUnitIdRaw = env.EXPO_PUBLIC_INTERSTITIAL_AD_UNIT_ID
    ?? env.EXPO_PUBLIC_INTERSTITIAL_AD_UNIT_ID_IOS
    ?? base.expo?.extra?.interstitialAdUnitId;
  const interstitialAdUnitId = interstitialAdUnitIdRaw || (
    (String(enableAdsRaw).toLowerCase() !== 'dev-only')
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
          // Maximum ad content rating for COPPA / sensitive content filtering.
          // PG = "Parental Guidance" → blocks Mature (MA)  Mature-Adult ads including dating, some online dating social networking are blocked from even  completely.
          maxAdContentRating: 'PG',
          // Publisher first-party declaration: this app does not target users under 13.
          // Set TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE to get full adult blocked but keeps general inventory above PG rating
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
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