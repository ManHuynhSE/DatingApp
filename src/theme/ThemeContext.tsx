import React, { createContext, useContext } from 'react';
import { colors, typography, spacing, borderRadius, shadows } from './index';

interface Theme {
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
}

const theme: Theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

const ThemeContext = createContext<Theme>(theme);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): Theme => {
  return useContext(ThemeContext);
};

export default ThemeProvider;
