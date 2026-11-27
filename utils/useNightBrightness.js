import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Brightness from 'expo-brightness';
import usePersistedState from './usePersistedState';

// 夜間とみなす時間帯（22:00 〜 翌 06:00）は輝度を下げる
export const NIGHT_START_HOUR = 22;
export const NIGHT_END_HOUR = 6;
export const NIGHT_BRIGHTNESS = 0.2;
export const DAY_BRIGHTNESS = 0.8;

// 時間帯の境界をまたいだかを確認する間隔（1分）
const CHECK_INTERVAL_MS = 60 * 1000;

const STORAGE_KEY = 'simplephotoframe.nightBrightness';

export function isNightTime(date = new Date()) {
  const hour = date.getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

export function getTargetBrightness(date = new Date()) {
  return isNightTime(date) ? NIGHT_BRIGHTNESS : DAY_BRIGHTNESS;
}

/**
 * 時間帯に応じて画面輝度を切り替えるフック。
 * - 有効化した時点の輝度を記録し、無効化・アンマウント時に必ず元へ戻す
 * - 1分ごと、およびフォアグラウンド復帰時に時間帯を再評価する
 */
export default function useNightBrightness() {
  const [enabled, setEnabled, ready] = usePersistedState(
    STORAGE_KEY,
    false,
    (value) => typeof value === 'boolean',
  );
  const originalRef = useRef(null);
  const appliedRef = useRef(null);

  const restore = useCallback(async () => {
    const original = originalRef.current;
    originalRef.current = null;
    appliedRef.current = null;
    if (original == null) return;
    try {
      await Brightness.setBrightnessAsync(original);
    } catch (error) {
      console.warn('Screen brightness could not be restored', error);
    }
  }, []);

  useEffect(() => {
    if (!ready || !enabled) return undefined;

    let disposed = false;
    let timer = null;

    const evaluate = async () => {
      // 元の輝度は有効化した時点で一度だけ記録する
      if (originalRef.current == null) {
        try {
          originalRef.current = await Brightness.getBrightnessAsync();
        } catch (error) {
          console.warn('Screen brightness could not be read', error);
        }
      }
      if (disposed) return;
      const target = getTargetBrightness();
      if (appliedRef.current === target) return;
      try {
        await Brightness.setBrightnessAsync(target);
        if (!disposed) appliedRef.current = target;
      } catch (error) {
        console.warn('Screen brightness could not be changed', error);
      }
    };

    evaluate();
    timer = setInterval(evaluate, CHECK_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') evaluate();
    });

    return () => {
      disposed = true;
      if (timer) clearInterval(timer);
      subscription.remove();
      restore();
    };
  }, [enabled, ready, restore]);

  return { enabled, setEnabled, ready };
}
