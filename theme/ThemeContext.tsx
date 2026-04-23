import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { darkColors, lightColors, ThemeMode } from './colors';

type ThemeContextValue = {
  themeMode: ThemeMode;
  colors: typeof lightColors;
  toggleTheme: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const STORAGE_KEY = 'trip_planner_theme_mode';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') {
          setThemeModeState(saved);
        }
      } catch {
      }
    }

    loadTheme();
  }, []);

  async function setThemeMode(mode: ThemeMode) {
    setThemeModeState(mode);
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  }

  async function toggleTheme() {
    const nextMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    await setThemeMode(nextMode);
  }

  const value = useMemo(
    () => ({
      themeMode,
      colors: themeMode === 'light' ? lightColors : darkColors,
      toggleTheme,
      setThemeMode,
    }),
    [themeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}