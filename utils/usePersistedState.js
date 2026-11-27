import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage に永続化される設定値フック。
 * - 読み込み完了前にユーザーが変更した場合は、後から届く保存値で上書きしない
 * - 書き込みは直列化して、素早い連続変更でも最後の値が確実に残るようにする
 * - isValid を渡すと、壊れた保存値は無視して既定値のままにする
 */
export default function usePersistedState(key, defaultValue, isValid = null) {
  const [value, setValue] = useState(defaultValue);
  const [ready, setReady] = useState(false);
  const valueRef = useRef(defaultValue);
  const touchedRef = useRef(false);
  const pendingWrite = useRef(Promise.resolve());

  useEffect(() => {
    let disposed = false;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (disposed || touchedRef.current || raw == null) return;
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch {
          return;
        }
        if (isValid && !isValid(parsed)) return;
        valueRef.current = parsed;
        setValue(parsed);
      })
      .catch((error) => console.warn(`Setting "${key}" could not be read`, error))
      .finally(() => {
        if (!disposed) setReady(true);
      });
    return () => { disposed = true; };
    // isValid は毎回新しい関数参照になり得るため依存に含めない（読み込みは初回のみ）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback((next) => {
    const resolved = typeof next === 'function' ? next(valueRef.current) : next;
    touchedRef.current = true;
    valueRef.current = resolved;
    setValue(resolved);
    // Serialize writes so rapid changes cannot persist an older value last.
    pendingWrite.current = pendingWrite.current
      .then(() => AsyncStorage.setItem(key, JSON.stringify(resolved)))
      .catch((error) => console.warn(`Setting "${key}" could not be saved`, error));
  }, [key]);

  return [value, update, ready];
}
