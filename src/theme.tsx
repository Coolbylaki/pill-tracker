import { createContext, useContext } from 'react';
import type { ThemeMode } from './data/preferences';

const dark = {
  background: '#0E1713',
  surface: '#17221F',
  border: '#2B3B34',
  accent: '#9BF2CD',
  text: '#F1F5F2',
  muted: '#A5B3AD',
  secondary: '#B5C4BC',
  soft: '#26342E',
  taken: '#234235',
  symbolBorder: '#3C5147',
  symbol: '#23332B',
  takenBorder: '#477E63',
  buttonTaken: '#233C30',
  buttonBorder: '#3D604C',
  onAccent: '#10231A',
  day: '#D4DED8',
  future: '#75877D',
};

const light: typeof dark = {
  background: '#F3F7F4',
  surface: '#FFFFFF',
  border: '#CCDCD2',
  accent: '#176B46',
  text: '#142D20',
  muted: '#52665A',
  secondary: '#425D4C',
  soft: '#E8F0EB',
  taken: '#D8F0E0',
  symbolBorder: '#BDCEC3',
  symbol: '#E8F0EB',
  takenBorder: '#7BA88B',
  buttonTaken: '#D8F0E0',
  buttonBorder: '#A0C3AE',
  onAccent: '#FFFFFF',
  day: '#284534',
  future: '#697D70',
};

export type Palette = typeof dark;
export function paletteFor(mode: ThemeMode): Palette {
  return mode === 'light' ? light : dark;
}
export const ThemeContext = createContext<Palette>(dark);
export function useTheme(): Palette {
  return useContext(ThemeContext);
}
