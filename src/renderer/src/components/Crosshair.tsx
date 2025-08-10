import { useMemo } from 'react'
import type { CrosshairConfig } from '../types/crosshair'

export function Crosshair({
  config,
  mode = 'overlay'
}: {
  config: CrosshairConfig
  mode?: 'overlay' | 'embed'
}) {
  const style = useMemo(() => {
    const isEmbed = mode === 'embed'
    const left = config.offsetX ?? 0
    const top = config.offsetY ?? 0
    return isEmbed
      ? {
          position: 'absolute' as const,
          inset: 0,
          pointerEvents: 'none' as const,
          background: 'transparent'
        }
      : {
          position: 'fixed' as const,
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none' as const,
          background: 'transparent',
          transform: `translate(${left}px, ${top}px)`
        }
  }, [mode, config.offsetX, config.offsetY])

  if (!config.enabled) return null

  const colorWithOpacity = hexToRgba(config.color, config.opacity)

  // calculate center
  const scale = config.scale && config.scale > 0 ? config.scale : 1
  const baseSize = Math.max((config.length + config.gap) * 2 + config.thickness * 2, 64)
  const size = Math.max(1, Math.round(baseSize * scale))
  const center = size / 2

  return (
    <div style={{ ...style, position: mode === 'embed' ? 'absolute' : ('fixed' as const) }}>
      <svg
        width={size}
        height={size}
        style={
          mode === 'embed'
            ? {
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${config.offsetX ?? 0}px, ${
                  config.offsetY ?? 0
                }px)`
              }
            : {
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }
        }
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

export function CrosshairPreview({
  config,
  size = 96
}: {
  config: CrosshairConfig
  size?: number
}) {
  // Reuse renderer but constrain SVG to preview size by scaling lengths to fit
  const scale = Math.min(
    1,
    size / Math.max((config.length + config.gap) * 2 + config.thickness * 2, 64)
  )
  const scaled: CrosshairConfig = {
    ...config,
    length: Math.max(1, Math.round(config.length * scale)),
    gap: Math.max(0, Math.round(config.gap * scale)),
    thickness: Math.max(1, Math.round(config.thickness * scale))
  }
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Crosshair mode="embed" config={{ ...scaled, enabled: true }} />
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
