import type { CrosshairConfig } from '@/types/crosshair'
import { defaultConfig } from '@/types/crosshair'
export const presets: { name: string; config: CrosshairConfig }[] = [
  {
    name: 'Green Classic',
    config: { ...defaultConfig, style: 'classic', color: '#22C55E', creator: 'Parcoil' }
  },
  {
    name: 'Tiny Dot',
    config: { ...defaultConfig, style: 'dot', thickness: 2, color: '#ffffff', creator: 'Parcoil' }
  },
  {
    name: 'Circle',
    config: { ...defaultConfig, style: 'circle', length: 12, gap: 2, creator: 'Parcoil' }
  },
  {
    name: 'X Neon',
    config: {
      ...defaultConfig,
      style: 'x',
      color: '#00e5ff',
      thickness: 2,
      gap: 3,
      creator: 'Parcoil'
    }
  }
]
