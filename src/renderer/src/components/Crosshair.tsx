import { useMemo } from 'react'
import type { CrosshairConfig } from '../types/crosshair'

export function Crosshair({ config }: { config: CrosshairConfig }) {
  const style = useMemo(() => {
    return {
      position: 'fixed' as const,
      inset: 0,
      pointerEvents: 'none' as const,
      background: 'transparent'
    }
  }, [])

  if (!config.enabled) return null

  const colorWithOpacity = hexToRgba(config.color, config.opacity)

  // Calculate center
  const size = (config.length + config.gap) * 2 + config.thickness * 2
  const center = size / 2

  return (
    <div style={style}>
      <svg
        width={size}
        height={size}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Horizontal left line */}
        <rect
          x={center - config.gap - config.length}
          y={center - config.thickness / 2}
          width={config.length}
          height={config.thickness}
          fill={colorWithOpacity}
        />
        {/* Horizontal right line */}
        <rect
          x={center + config.gap}
          y={center - config.thickness / 2}
          width={config.length}
          height={config.thickness}
          fill={colorWithOpacity}
        />
        {/* Vertical top line */}
        <rect
          x={center - config.thickness / 2}
          y={center - config.gap - config.length}
          width={config.thickness}
          height={config.length}
          fill={colorWithOpacity}
        />
        {/* Vertical bottom line */}
        <rect
          x={center - config.thickness / 2}
          y={center + config.gap}
          width={config.thickness}
          height={config.length}
          fill={colorWithOpacity}
        />
        {config.centerDot && (
          <circle cx={center} cy={center} r={config.thickness} fill={colorWithOpacity} />
        )}
      </svg>
    </div>
  )
}

function hexToRgba(hex: string, alpha: number) {
  const parsed = hex.replace('#', '')
  if (parsed.length !== 6) return `rgba(0, 0, 0, ${alpha})`
  const bigint = parseInt(parsed, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
