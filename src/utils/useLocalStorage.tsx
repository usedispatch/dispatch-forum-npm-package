import { useState, useEffect } from "react";

function getStorageValue(key: string, defaultValue: string) {
  let initial: string| null = null
  if (typeof window !== "undefined") {
    initial = window.localStorage.getItem(key);
  }
  
  return initial || defaultValue;
}

export const useLocalStorage = (key: string, defaultValue: string) => {
  const [value, setValue] = useState(() => {
    return getStorageValue(key, defaultValue);
  });

  useEffect(() => {
    localStorage.setItem(key, value);
  }, [key, value]);

  return [value, setValue] as const;
};