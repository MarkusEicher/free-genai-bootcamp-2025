export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

export interface ThemeSettings {
  colors: ThemeColors
  fontSize: 'small' | 'medium' | 'large'
  borderRadius: 'none' | 'small' | 'medium' | 'large'
  spacing: 'compact' | 'comfortable' | 'spacious'
  buttonStyle: 'filled' | 'outlined' | 'text'
  animationSpeed: 'none' | 'slow' | 'normal' | 'fast'
  fontFamily: 'sans' | 'serif' | 'mono'
  fontWeight: 'normal' | 'medium' | 'bold'
}

export interface ThemePreset {
  id: string
  name: string
  colors: ThemeColors
  fontSize: ThemeSettings['fontSize']
  borderRadius: ThemeSettings['borderRadius']
  spacing: ThemeSettings['spacing']
}

export const themePresets: ThemePreset[] = [
  {
    id: 'light',
    name: 'Light Mode',
    colors: {
      primary: '#3b82f6',
      secondary: '#6366f1',
      accent: '#10b981',
      background: '#ffffff',
      text: '#1f2937'
    },
    fontSize: 'medium',
    borderRadius: 'medium',
    spacing: 'comfortable'
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    colors: {
      primary: '#60a5fa',
      secondary: '#818cf8',
      accent: '#34d399',
      background: '#1f2937',
      text: '#f3f4f6'
    },
    fontSize: 'medium',
    borderRadius: 'medium',
    spacing: 'comfortable'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    colors: {
      primary: '#000000',
      secondary: '#404040',
      accent: '#737373',
      background: '#ffffff',
      text: '#171717'
    },
    fontSize: 'small',
    borderRadius: 'none',
    spacing: 'compact'
  }
] 