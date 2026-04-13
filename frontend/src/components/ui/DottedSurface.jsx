import { useEffect, useRef } from 'react'

// 2D canvas dotted wave — sits in the bottom half of the screen
export function DottedSurface({ className = '', ...props }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const COLS    = 55
    const ROWS    = 18
    const GAP_X   = 28
    const GAP_Y   = 22

    let W, H, offsetX, offsetY, count = 0

    const resize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
      offsetX = (W - (COLS - 1) * GAP_X) / 2
      offsetY = H * 0.55   // start from 55% down the screen
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const wave =
            Math.sin((row + count) * 0.35) * 20 +
            Math.sin((col * 0.18) + count * 0.5) * 10

          const x = offsetX + col * GAP_X
          const y = offsetY + row * GAP_Y + wave

          // Fade out towards top and edges
          const topFade  = Math.min(1, row / 4)
          const edgeFade = Math.min(1, Math.min(col, COLS - 1 - col) / 6)
          const alpha    = topFade * edgeFade * 0.35

          if (alpha < 0.01) continue

          const dotSize = 1.8

          ctx.beginPath()
          ctx.arc(x, y, dotSize, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
          ctx.fill()
        }
      }

      count += 0.04
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 ${className}`}
      style={{ zIndex: 0 }}
      {...props}
    />
  )
}
