'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'

interface DockItem {
  id: string
  name: string
  icon: React.ReactNode
  href: string
}

interface MacOSDockProps {
  items: DockItem[]
  className?: string
}

const MacOSDock: React.FC<MacOSDockProps> = ({ items, className = '' }) => {
  const [mouseX, setMouseX] = useState<number | null>(null)
  const [currentScales, setCurrentScales] = useState<number[]>(items.map(() => 1))
  const [currentPositions, setCurrentPositions] = useState<number[]>([])
  const dockRef = useRef<HTMLDivElement>(null)
  const iconRefs = useRef<(HTMLDivElement | null)[]>([])
  const animationFrameRef = useRef<number | undefined>(undefined)
  const lastMouseMoveTime = useRef<number>(0)

  const getResponsiveConfig = useCallback(() => {
    if (typeof window === 'undefined') {
      return { baseIconSize: 48, maxScale: 1.6, effectWidth: 240 }
    }
    const w = window.innerWidth
    if (w < 480) {
      return { baseIconSize: 36, maxScale: 1.4, effectWidth: 160 }
    } else if (w < 768) {
      return { baseIconSize: 42, maxScale: 1.5, effectWidth: 200 }
    } else {
      return { baseIconSize: 48, maxScale: 1.8, effectWidth: 280 }
    }
  }, [])

  const [config, setConfig] = useState(getResponsiveConfig)
  const { baseIconSize, maxScale, effectWidth } = config
  const minScale = 1.0
  const baseSpacing = 6
  const dockPadding = 8

  useEffect(() => {
    setConfig(getResponsiveConfig())
    const handleResize = () => setConfig(getResponsiveConfig())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [getResponsiveConfig])

  const calculateTargetMagnification = useCallback(
    (mousePosition: number | null) => {
      if (mousePosition === null) return items.map(() => minScale)
      return items.map((_, index) => {
        const normalIconCenter = index * (baseIconSize + baseSpacing) + baseIconSize / 2
        const minX = mousePosition - effectWidth / 2
        const maxX = mousePosition + effectWidth / 2
        if (normalIconCenter < minX || normalIconCenter > maxX) return minScale
        const theta = ((normalIconCenter - minX) / effectWidth) * 2 * Math.PI
        const cappedTheta = Math.min(Math.max(theta, 0), 2 * Math.PI)
        const scaleFactor = (1 - Math.cos(cappedTheta)) / 2
        return minScale + scaleFactor * (maxScale - minScale)
      })
    },
    [items, baseIconSize, baseSpacing, effectWidth, maxScale, minScale],
  )

  const calculatePositions = useCallback(
    (scales: number[]) => {
      let currentX = 0
      return scales.map((scale) => {
        const scaledWidth = baseIconSize * scale
        const centerX = currentX + scaledWidth / 2
        currentX += scaledWidth + baseSpacing
        return centerX
      })
    },
    [baseIconSize, baseSpacing],
  )

  useEffect(() => {
    const initial = items.map(() => minScale)
    setCurrentScales(initial)
    setCurrentPositions(calculatePositions(initial))
  }, [items, calculatePositions, minScale, config])

  const animateToTarget = useCallback(() => {
    const targetScales = calculateTargetMagnification(mouseX)
    const targetPositions = calculatePositions(targetScales)
    const lerpFactor = mouseX !== null ? 0.2 : 0.12

    setCurrentScales((prev) =>
      prev.map((s, i) => s + (targetScales[i] - s) * lerpFactor),
    )
    setCurrentPositions((prev) =>
      prev.map((p, i) => p + (targetPositions[i] - p) * lerpFactor),
    )

    const needsUpdate =
      mouseX !== null ||
      currentScales.some((s, i) => Math.abs(s - targetScales[i]) > 0.002) ||
      currentPositions.some((p, i) => Math.abs(p - targetPositions[i]) > 0.1)

    if (needsUpdate) {
      animationFrameRef.current = requestAnimationFrame(animateToTarget)
    }
  }, [mouseX, calculateTargetMagnification, calculatePositions, currentScales, currentPositions])

  useEffect(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    animationFrameRef.current = requestAnimationFrame(animateToTarget)
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [animateToTarget])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const now = performance.now()
      if (now - lastMouseMoveTime.current < 16) return
      lastMouseMoveTime.current = now
      if (dockRef.current) {
        const rect = dockRef.current.getBoundingClientRect()
        setMouseX(e.clientX - rect.left - dockPadding)
      }
    },
    [dockPadding],
  )

  const handleMouseLeave = useCallback(() => setMouseX(null), [])

  const handleItemClick = (item: DockItem, index: number) => {
    const el = iconRefs.current[index]
    if (el) {
      const bounceHeight = -baseIconSize * 0.18
      el.style.transition = 'transform 0.2s ease-out'
      el.style.transform = `translateY(${bounceHeight}px)`
      setTimeout(() => {
        el.style.transform = 'translateY(0px)'
      }, 200)
    }
    if (item.href.startsWith('http') || item.href.startsWith('mailto:')) {
      window.open(item.href, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = item.href
    }
  }

  const contentWidth =
    currentPositions.length > 0
      ? Math.max(
          ...currentPositions.map(
            (pos, i) => pos + (baseIconSize * currentScales[i]) / 2,
          ),
        )
      : items.length * (baseIconSize + baseSpacing) - baseSpacing

  const dockHeight = baseIconSize + dockPadding * 2

  return (
    <div
      ref={dockRef}
      className={`backdrop-blur-xl ${className}`}
      style={{
        width: `${contentWidth + dockPadding * 2}px`,
        background: 'rgba(30, 30, 30, 0.7)',
        borderRadius: `${dockHeight / 2}px`,
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.4),
          0 2px 8px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.1),
          inset 0 -1px 0 rgba(0, 0, 0, 0.15)
        `,
        padding: `${dockPadding}px`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative" style={{ height: `${baseIconSize}px`, width: '100%' }}>
        {items.map((item, index) => {
          const scale = currentScales[index]
          const position = currentPositions[index] || 0
          const scaledSize = baseIconSize * scale

          return (
            <div
              key={item.id}
              ref={(el) => { iconRefs.current[index] = el }}
              className="absolute cursor-pointer flex items-center justify-center"
              title={item.name}
              onClick={() => handleItemClick(item, index)}
              style={{
                left: `${position - scaledSize / 2}px`,
                bottom: '0px',
                width: `${scaledSize}px`,
                height: `${scaledSize}px`,
                transformOrigin: 'bottom center',
                zIndex: Math.round(scale * 10),
                filter: `drop-shadow(0 ${scale > 1.2 ? 4 : 2}px ${scale > 1.2 ? 8 : 4}px rgba(0,0,0,${0.25 + (scale - 1) * 0.2}))`,
              }}
            >
              <div className="w-full h-full">{item.icon}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { MacOSDock }
export type { DockItem }
