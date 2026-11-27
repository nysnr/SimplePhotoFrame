import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Brightness from 'expo-brightness';
import usePersistedState from './usePersistedState';

// 夜間（既定では 22:00 〜 翌 06:00）は輝度を下げる
export const DEFAULT_NIGHT_START_HOUR = 22;
export const DEFAULT_NIGHT_END_HOUR = 6;
export const DEFAULT_ENABLED = true;
export const NIGHT_BRIGHTNESS = 0.2;
export const DAY_BRIGHTNESS = 0.8;

// 時間帯の境界をまたいだかを確認する間隔（1分）
const CHECK_INTERVAL_MS = 60 * 1000;

const STORAGE_KEY_ENABLED = 'simplephotoframe.nightBrightness';
const STORAGE_KEY_START = 'simplephotoframe.nightBrightnessStartHour';
const STORAGE_KEY_END = 'simplephotoframe.nightBrightnessEndHour';

const isBoolean = (value) => typeof value === 'boolean';
const isHour = (value) => Number.isInteger(value) && value >= 0 && value <= 23;

/**
 * 指定した時間帯かどうかを判定する。
 * startHour === endHour のときは夜間なし（常に日中）として扱う。
 */
export function isNightTime(
  date = new Date(),
  startHour = DEFAULT_NIGHT_START_HOUR,
  endHour = DEFAULT_NIGHT_END_HOUR
) {
  if (startHour === endHour) return false;
  const hour = date.getHours();
  if (startHour < endHour) return hour >= startHour && hour < endHour;
  return hour >= startHour || hour < endHour;
}

export function getTargetBrightness(
  date = new Date(),
  startHour = DEFAULT_NIGHT_START_HOUR,
  endHour = DEFAULT_NIGHT_END_HOUR
) {
  return isNightTime(date, startHour, endHour) ? NIGHT_BRIGHTNESS : DAY_BRIGHTNESS;
}

/**
 * 時間帯に応じて画面輝度を切り替えるフック。
 * - 有効化した時点の輝度を記録し、無効化・アンマウント時に必ず元へ戻す
 * - 1分ごと、およびフォアグラウンド復帰時に時間帯を再評価する
 * - 夜間の開始・終了時刻は設定で変更できる
 */
export default function useNightBrightness() {
  const [enabled, setEnabled, enabledReady, resetEnabled] = usePersistedState(
    STORAGE_KEY_ENABLED,
    DEFAULT_ENABLED,
    isBoolean
  );
  const [startHour, setStartHour, startReady, resetStartHour] = usePersistedState(
    STORAGE_KEY_START,
    DEFAULT_NIGHT_START_HOUR,
    isHour
  );
  const [endHour, setEndHour, endReady, resetEndHour] = usePersistedState(
    STORAGE_KEY_END,
    DEFAULT_NIGHT_END_HOUR,
    isHour
  );
  const ready = enabledReady && startReady && endReady;

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

  // アンマウント時は必ず元の輝度へ戻す（何も変更していなければ no-op）
  useEffect(() => () => { restore(); }, [restore]);

  useEffect(() => {
    if (!ready) return undefined;

    if (!enabled) {
      restore();
      return undefined;
    }

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
      const target = getTargetBrightness(new Date(), startHour, endHour);
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
    };
  }, [enabled, ready, startHour, endHour, restore]);

  const reset = useCallback(() => {
    resetEnabled();
    resetStartHour();
    resetEndHour();
  }, [resetEnabled, resetStartHour, resetEndHour]);

  return {
    enabled,
    setEnabled,
    ready,
    startHour,
    setStartHour,
    endHour,
    setEndHour,
    reset,
  };
}
