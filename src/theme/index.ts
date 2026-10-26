export const colors = {
  primary: '#FF6B6B',
  primaryLight: '#FFE7E4',
  secondary: '#5B5FEF',
  secondaryLight: '#ECECFF',
  background: '#FFFDF8',
  surface: '#F7F4EE',
  textPrimary: '#18202A',
  textSecondary: '#68717D',
  textTertiary: '#A3A9B0',
  border: '#E5E1D8',
  borderLight: '#F0EDE6',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  online: '#22C55E',
  offline: '#9CA3AF',
  away: '#F59E0B',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  cardGradientStart: '#FFF0E8',
  cardGradientEnd: '#ECECFF',
  facebook: '#1877F2',
  apple: '#000000',
  phone: '#FF6B6B',
  tabActive: '#FF6B6B',
  tabInactive: '#68717D',
  tabBorder: '#E5E1D8',
  notificationDot: '#EF4444',
  headerIcon: '#18202A',
  headerTitle: '#18202A',
};

export const darkColors = {
  ...colors,
  primaryLight: '#3B2527',
  secondaryLight: '#29294A',
  background: '#101114',
  surface: '#1A1C21',
  textPrimary: '#F6F7F9',
  textSecondary: '#B3B8C2',
  textTertiary: '#7D8490',
  border: '#30343D',
  borderLight: '#242831',
  white: '#F6F7F9',
  black: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.72)',
  cardGradientStart: '#342325',
  cardGradientEnd: '#252545',
  tabInactive: '#B3B8C2',
  tabBorder: '#30343D',
  headerIcon: '#F6F7F9',
  headerTitle: '#F6F7F9',
};

const lightPalette = { ...colors };
const darkPalette = { ...darkColors };

export const applyRuntimePalette = (mode: 'light' | 'dark') => {
  return mode;
};

export const resolveThemeStyles = <T,>(styles: T, theme: typeof colors): T => {
  const lightValues = lightPalette as Record<string, string>;
  const darkValues = darkPalette as Record<string, string>;
  const themeValues = theme as Record<string, string>;
  const resolve = (value: unknown): unknown => {
    if (typeof value === 'string') {
      const paletteKey = Object.keys(lightValues).find(
        (key) => lightValues[key] === value || darkValues[key] === value,
      );
      return paletteKey ? themeValues[paletteKey] : value;
    }
    if (Array.isArray(value)) return value.map(resolve);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [key, resolve(child)]),
      );
    }
    return value;
  };

  return resolve(styles) as T;
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 24, fontWeight: '700' as const },
  h3: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyBold: { fontSize: 16, fontWeight: '600' as const },
  bodySmall: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  captionBold: { fontSize: 12, fontWeight: '600' as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  '2xl': 32,
  '3xl': 40,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
