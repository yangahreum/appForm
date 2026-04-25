import { useState, useEffect } from 'react';

export function useStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    chrome.storage.local.get(key, (result) => {
      if (result[key] !== undefined) {
        setValue(result[key] as T);
      }
    });

    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (key in changes) {
        setValue(changes[key].newValue as T);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [key]);

  const set = (newValue: T) => {
    setValue(newValue);
    chrome.storage.local.set({ [key]: newValue });
  };

  return [value, set];
}
