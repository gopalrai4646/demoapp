export const COLORS = {
  background: '#f7f9fb',
  primary: '#3525cd',
  primaryContainer: '#4f46e5',
  secondary: '#505f76',
  secondaryContainer: '#d0e1fb',
  tertiary: '#7e3000',
  surface: '#f7f9fb',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  surfaceContainerHigh: '#e6e8ea',
  surfaceContainerHighest: '#e0e3e5',
  onSurface: '#191c1e',
  onSurfaceVariant: '#464555',
  onPrimary: '#ffffff',
  outline: '#777587',
  outlineVariant: '#c7c4d8',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const ROUNDNESS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const TYPOGRAPHY = {
  headline: {
    fontSize: 24,
    fontWeight: '700' as const,
    fontFamily: 'Inter-Bold', // Assuming Inter is available or fallback
    color: '#2c2f31',
  },
  subHeadline: {
    fontSize: 14,
    fontWeight: '400' as const,
    fontFamily: 'Inter-Regular',
    color: '#595c5e',
    lineHeight: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: 'Inter-SemiBold',
    color: '#2c2f31',
  },
  label: {
    fontSize: 12,
    fontWeight: '500' as const,
    fontFamily: 'Inter-Medium',
    color: '#595c5e',
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    fontFamily: 'Inter-Regular',
    color: '#2c2f31',
    lineHeight: 22,
  },
};
