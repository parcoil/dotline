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
  const size = Math.max((config.length + config.gap) * 2 + config.thickness * 2, 64)
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
        {config.style === 'classic' && (
          <>
            <rect
              x={center - config.gap - config.length}
              y={center - config.thickness / 2}
              width={config.length}
              height={config.thickness}
              fill={colorWithOpacity}
            />
            <rect
              x={center + config.gap}
              y={center - config.thickness / 2}
              width={config.length}
              height={config.thickness}
              fill={colorWithOpacity}
            />
            <rect
              x={center - config.thickness / 2}
              y={center - config.gap - config.length}
              width={config.thickness}
              height={config.length}
              fill={colorWithOpacity}
            />
            <rect
              x={center - config.thickness / 2}
              y={center + config.gap}
              width={config.thickness}
              height={config.length}
              fill={colorWithOpacity}
            />
          </>
        )}

        {config.style === 'dot' && (
          <circle
            cx={center}
            cy={center}
            r={Math.max(1, config.thickness)}
            fill={colorWithOpacity}
          />
        )}

        {config.style === 'circle' && (
          <circle
            cx={center}
            cy={center}
            r={config.gap + Math.max(2, config.length)}
            stroke={colorWithOpacity}
            strokeWidth={config.thickness}
            fill="none"
          />
        )}

        {config.style === 'x' && (
          <>
            <rect
              x={center - config.thickness / 2}
              y={center - config.length - config.gap}
              width={config.thickness}
              height={config.length}
              transform={`rotate(45 ${center} ${center})`}
              fill={colorWithOpacity}
            />
            <rect
              x={center - config.thickness / 2}
              y={center + config.gap}
              width={config.thickness}
              height={config.length}
              transform={`rotate(45 ${center} ${center})`}
              fill={colorWithOpacity}
            />
            <rect
              x={center - config.thickness / 2}
              y={center - config.length - config.gap}
              width={config.thickness}
              height={config.length}
              transform={`rotate(-45 ${center} ${center})`}
              fill={colorWithOpacity}
            />
            <rect
              x={center - config.thickness / 2}
              y={center + config.gap}
              width={config.thickness}
              height={config.length}
              transform={`rotate(-45 ${center} ${center})`}
              fill={colorWithOpacity}
            />
          </>
        )}

        {config.centerDot && (
          <circle
            cx={center}
            cy={center}
            r={Math.max(1, config.thickness / 2)}
            fill={colorWithOpacity}
          />
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
