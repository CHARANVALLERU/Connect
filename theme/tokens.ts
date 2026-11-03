/** Connect design tokens — Premium cream / Elite obsidian-gold */

export const premium = {
  bg: '#F7F5F0',
  surface: '#FFFFFF',
  surfaceMuted: '#EFEBE3',
  text: '#141414',
  textMuted: '#6B7280',
  accent: '#0F3D2E',
  accentSoft: '#1A5C45',
  border: '#E5E0D6',
  danger: '#B42318',
  success: '#027A48',
  glow: 'rgba(15,61,46,0.12)',
  tabInactive: '#9CA3AF',
};

export const elite = {
  bg: '#0B0B0C',
  surface: '#161618',
  surfaceMuted: '#1E1E22',
  text: '#F5F0E6',
  textMuted: '#A1A1AA',
  accent: '#D4AF37',
  accentSoft: '#B8922E',
  border: '#2A2A30',
  danger: '#F97066',
  success: '#32D583',
  glow: 'rgba(212,175,55,0.25)',
  tabInactive: '#71717A',
};

export type ConnectPalette = typeof premium;

export function paletteFor(isElite: boolean): ConnectPalette {
  return isElite ? elite : premium;
}
