import { useEffect, useRef } from "react"

const WAVES = [
  { freq: 0.011, amp: 60,  speed: 0.00055, phase: 0,           color: "rgba(6,182,212,0.75)",  blur: 22, width: 1.8, yFrac: 0.38 },
  { freq: 0.007, amp: 75,  speed: 0.00040, phase: Math.PI,     color: "rgba(168,85,247,0.65)", blur: 28, width: 1.8, yFrac: 0.50 },
  { freq: 0.015, amp: 42,  speed: 0.00075, phase: Math.PI/2,   color: "rgba(6,182,212,0.45)",  blur: 14, width: 1.2, yFrac: 0.60 },
  { freq: 0.009, amp: 65,  speed: 0.00035, phase: Math.PI*1.5, color: "rgba(168,85,247,0.45)", blur: 32, width: 1.2, yFrac: 0.68 },
  { freq: 0.013, amp: 48,  speed: 0.00060, phase: Math.PI/3,   color: "rgba(6,182,212,0.30)",  blur: 12, width: 1,   yFrac: 0.28 },
  { freq: 0.006, amp: 85,  speed: 0.00030, phase: Math.PI*0.8, color: "rgba(168,85,247,0.28)", blur: 40, width: 1,   yFrac: 0.76 },
  { freq: 0.018, amp: 30,  speed: 0.00090, phase: Math.PI*0.4, color: "rgba(34,211,238,0.25)", blur: 8,  width: 0.8, yFrac: 0.44 },
]

export default function WavesBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let targetX = mouseX
    let targetY = mouseY
    let animId

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const onMouseMove = (e) => {
      targetX = e.clientX
      targetY = e.clientY
    }
    window.addEventListener("mousemove", onMouseMove)

    const draw = (ts) => {
      // smooth mouse
      mouseX += (targetX - mouseX) * 0.06
      mouseY += (targetY - mouseY) * 0.06

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      WAVES.forEach((wave) => {
        const baseY = canvas.height * wave.yFrac

        ctx.save()
        ctx.shadowBlur  = wave.blur
        ctx.shadowColor = wave.color
        ctx.strokeStyle = wave.color
        ctx.lineWidth   = wave.width
        ctx.beginPath()

        for (let x = 0; x <= canvas.width; x += 3) {
          let y = baseY + Math.sin(x * wave.freq + ts * wave.speed + wave.phase) * wave.amp

          // mouse ripple within 350px radius
          const dx   = x - mouseX
          const dy   = y - mouseY
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 350) {
            const pull = (1 - dist / 350) * 28
            y += (mouseY - y) * pull * 0.04
          }

          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }

        ctx.stroke()
        ctx.restore()
      })

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  )
}
