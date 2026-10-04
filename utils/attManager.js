import { Platform, Alert } from 'react-native';
import { getLocales } from 'expo-localization';

const ATT_STATUS_KEY = 'simplephotoframe.attConsentStatus';
const ATT_PROMPTED_KEY = 'simplephotoframe.attPromptedAt';

const STATUS_NOT_DETERMINED = 'notDetermined';
const STATUS_RESTRICTED = 'restricted';
const STATUS_DENIED = 'denied';
const STATUS_AUTHORIZED = 'authorized';

const promptLocalizations = {
  en: {
    title: 'Help us show better ads',
    message:
      'Would you like to allow personalized ads? They help keep SimplePhotoFrame free while keeping your data private. You can change this anytime in Settings.',
    allow: 'Continue',
    decline: 'Not Now',
  },
  ja: {
    title: 'より良い広告表示のために',
    message:
      'パーソナライズ広告を許可しますか？SimplePhotoFrame を無料で維持する支援となります。データはプライベートに保たれます。設定からいつでも変更可能です。',
    allow: '続ける',
    decline: '今回はスキップ',
  },
  zh: {
    title: '帮助我们展示更优质的广告',
    message:
      '是否允许个性化广告？这有助于 SimplePhotoFrame 保持免费，同时您的数据将保持私密。您可随时在设置中更改此选项。',
    allow: '继续',
    decline: '暂不',
  },
  es: {
    title: 'Ayúdanos a mostrar mejores anuncios',
    message:
      '¿Deseas permitir anuncios personalizados? Ayudan a mantener SimplePhotoFrame gratuito mientras protegen tu privacidad. Puedes cambiarlo en cualquier momento en Ajustes.',
    allow: 'Continuar',
    decline: 'Ahora no',
  },
};

const getPromptForLocale = () => {
  try {
    const locales = getLocales();
    const first = locales?.[0]?.languageCode || 'en';
    const code = first === 'zh-Hans' || first === 'zh' ? 'zh' : first;
    return promptLocalizations[code] || promptLocalizations.en;
  } catch {
    return promptLocalizations.en;
  }
};

const tryAsyncStorage = async (method, key, fallback = undefined) => {
  try {
    const AS =
      globalThis.expo?.modules?.AsyncStorage ||
      (await (async () => {
        try {
          const mod = await import('@react-native-async-storage/async-storage');
          return mod.default || mod;
        } catch {
          return null;
        }
      })());
    if (!AS) return fallback;
    const res = await AS[method](key);
    return res == null ? fallback : res;
  } catch {
    return fallback;
  }
};

export const getStoredAttStatus = async () => {
  if (Platform.OS !== 'ios') return STATUS_AUTHORIZED;
  return (await tryAsyncStorage('getItem', ATT_STATUS_KEY)) || STATUS_NOT_DETERMINED;
};

export const storeAttStatus = async (status) => {
  if (Platform.OS !== 'ios') return;
  await tryAsyncStorage('setItem', ATT_STATUS_KEY, status, null);
};

export const getLastPromptedAt = async () => {
  const raw = await tryAsyncStorage('getItem', ATT_PROMPTED_KEY);
  if (!raw) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const markPromptedAt = async (ts = Date.now()) => {
  await tryAsyncStorage('setItem', ATT_PROMPTED_KEY, String(ts), null);
};

const requestTrackingAuthorizationNative = async () => {
  try {
    const RNGoogleMobileAds = await import('react-native-google-mobile-ads');
    const mobileAds = RNGoogleMobileAds.default?.mobileAds || RNGoogleMobileAds.mobileAds;
    if (!mobileAds) return STATUS_NOT_DETERMINED;
    const res = await mobileAds().requestTrackingAuthorization();
    switch (res) {
      case 0: return STATUS_NOT_DETERMINED;
      case 1: return STATUS_RESTRICTED;
      case 2: return STATUS_DENIED;
      case 3: return STATUS_AUTHORIZED;
      default: return STATUS_NOT_DETERMINED;
    }
  } catch {
    return STATUS_NOT_DETERMINED;
  }
};

export const ATT_STATUS = {
  NOT_DETERMINED: STATUS_NOT_DETERMINED,
  RESTRICTED: STATUS_RESTRICTED,
  DENIED: STATUS_DENIED,
  AUTHORIZED: STATUS_AUTHORIZED,
};

export const runAttFlow = async () => {
  if (Platform.OS !== 'ios') {
    return { status: STATUS_AUTHORIZED, prompted: false };
  }

  let existingStatus = await getStoredAttStatus();

  if (
    existingStatus === STATUS_AUTHORIZED ||
    existingStatus === STATUS_DENIED ||
    existingStatus === STATUS_RESTRICTED
  ) {
    return { status: existingStatus, prompted: false };
  }

  const lastPrompted = await getLastPromptedAt();
  const now = Date.now();
  const COOLDOWN_MS = 24 * 60 * 60 * 1000;

  if (lastPrompted && now - lastPrompted < COOLDOWN_MS) {
    return { status: existingStatus, prompted: false };
  }

  const p = getPromptForLocale();

  const shouldPrompt = await new Promise((resolve) => {
    Alert.alert(
      p.title,
      p.message,
      [
        { text: p.decline, style: 'cancel', onPress: () => resolve(false) },
        { text: p.allow, style: 'default', onPress: () => resolve(true) },
      ],
      { cancelable: false }
    );
  });

  await markPromptedAt(now);

  if (!shouldPrompt) {
    return { status: existingStatus, prompted: true, nativeDialogShown: false };
  }

  const nativeStatus = await requestTrackingAuthorizationNative();
  await storeAttStatus(nativeStatus);

  return { status: nativeStatus, prompted: true, nativeDialogShown: true };
};
