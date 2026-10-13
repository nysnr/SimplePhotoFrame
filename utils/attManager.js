import { Platform, AppState } from 'react-native';

const ATT_STATUS_KEY = 'simplephotoframe.attConsentStatus.v2';
const ATT_PROMPTED_KEY = 'simplephotoframe.attPromptedAt.v2';

const STATUS_NOT_DETERMINED = 'notDetermined';
const STATUS_RESTRICTED = 'restricted';
const STATUS_DENIED = 'denied';
const STATUS_AUTHORIZED = 'authorized';

const LEGACY_KEYS = [
  'simplephotoframe.attConsentStatus',
  'simplephotoframe.attPromptedAt',
  'spf:att:consent:status',
  'spf:att:prompted:at',
];

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

const purgeLegacyAttKeys = async () => {
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
    if (!AS) return;
    for (const k of LEGACY_KEYS) {
      try { await AS.removeItem(k); } catch {}
    }
  } catch {}
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

const ACTIVE_WAIT_TIMEOUT_MS = 12_000;
const waitUntilAppActive = () => {
  if (Platform.OS !== 'ios') return Promise.resolve();
  if (AppState.currentState === 'active') return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      try { subscription.remove(); } catch {}
      clearTimeout(timer);
      resolve();
    };
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') finish();
    });
    const timer = setTimeout(finish, ACTIVE_WAIT_TIMEOUT_MS);
    if (AppState.currentState === 'active') finish();
  });
};

const STATUS_MAP_ETT = {
  granted: STATUS_AUTHORIZED,
  denied: STATUS_DENIED,
  restricted: STATUS_RESTRICTED,
  undetermined: STATUS_NOT_DETERMINED,
  unavailable: STATUS_NOT_DETERMINED,
  blocked: STATUS_RESTRICTED,
};

const requestTrackingAuthorizationNative = async () => {
  if (Platform.OS !== 'ios') return STATUS_AUTHORIZED;
  try {
    const ETT = await import('expo-tracking-transparency');
    const { status, granted } = await ETT.requestTrackingPermissionsAsync();
    if (granted) return STATUS_AUTHORIZED;
    if (STATUS_MAP_ETT[status]) return STATUS_MAP_ETT[status];
    return STATUS_NOT_DETERMINED;
  } catch {
    return STATUS_NOT_DETERMINED;
  }
};

export const initializeMobileAds = async () => {
  try {
    const RNGoogleMobileAds = await import('react-native-google-mobile-ads');
    const mobileAds = RNGoogleMobileAds.default?.mobileAds || RNGoogleMobileAds.mobileAds;
    if (!mobileAds) return false;
    await mobileAds().initialize();
    return true;
  } catch {
    return false;
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

  await purgeLegacyAttKeys();

  const existingStatus = await getStoredAttStatus();

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

  await waitUntilAppActive();

  const nativeStatus = await requestTrackingAuthorizationNative();

  if (nativeStatus !== STATUS_NOT_DETERMINED) {
    await storeAttStatus(nativeStatus);
    await markPromptedAt(now);
    return { status: nativeStatus, prompted: true, nativeDialogShown: true };
  }

  const MAX_RETRIES = 3;
  let attempts = 0;
  let retriedStatus = STATUS_NOT_DETERMINED;

  while (attempts < MAX_RETRIES) {
    attempts += 1;
    await new Promise((r) => setTimeout(r, 1200 * attempts));
    await waitUntilAppActive();
    retriedStatus = await requestTrackingAuthorizationNative();
    if (retriedStatus !== STATUS_NOT_DETERMINED) {
      await storeAttStatus(retriedStatus);
      await markPromptedAt(Date.now());
      return { status: retriedStatus, prompted: true, nativeDialogShown: true, retried: attempts };
    }
  }

  return { status: STATUS_NOT_DETERMINED, prompted: false, nativeDialogShown: false, retried: attempts };
};
