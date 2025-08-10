export type CrosshairStyle = 'classic' | 'dot' | 'circle' | 'x'

export type CrosshairConfig = {
  enabled: boolean
  style: CrosshairStyle
  color: string
  opacity: number
  thickness: number
  length: number
  gap: number
  centerDot: boolean
  creator?: string
  overlayDisplayId?: number
  offsetX?: number
  offsetY?: number
  scale?: number
}

export type CrosshairLibraryItem = {
  id: string
  name: string
  createdAt: number
  config: CrosshairConfig
}
export const defaultConfig: CrosshairConfig = {
  enabled: true,
  style: 'classic',
  color: '#22C55E',
  opacity: 1,
  thickness: 2,
  length: 5,
  gap: 0,
  centerDot: false
}
