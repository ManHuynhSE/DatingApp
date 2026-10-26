import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, darkColors } from '../theme';

type ThemeMode = 'light' | 'dark';

const lightColors = { ...colors };

const applyPalette = (mode: ThemeMode) => {
  Object.assign(colors, mode === 'dark' ? darkColors : lightColors);
};

interface ThemeState {
  mode: ThemeMode;
  toggleMode: () => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light',
  toggleMode: () =>
    set((state) => {
      const mode = state.mode === 'light' ? 'dark' : 'light';
      applyPalette(mode);
      void AsyncStorage.setItem('heartsync-theme', mode);
      return { mode };
    }),
  hydrate: async () => {
    const storedMode = await AsyncStorage.getItem('heartsync-theme');
    if (storedMode === 'dark' || storedMode === 'light') {
      applyPalette(storedMode);
      set({ mode: storedMode });
    }
  },
}));
