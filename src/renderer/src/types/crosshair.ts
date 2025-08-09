export type CrosshairConfig = {
  enabled: boolean
  color: string
  opacity: number
  thickness: number
  length: number
  gap: number
  centerDot: boolean
}
export const defaultConfig: CrosshairConfig = {
  enabled: true,
  color: '#22C55E',
  opacity: 1,
  thickness: 2,
  length: 5,
  gap: 0,
  centerDot: false
}
