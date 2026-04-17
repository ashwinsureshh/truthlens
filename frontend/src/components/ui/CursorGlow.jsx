import { useEffect, useRef, useState } from "react"

const COLORS = {
  default:    { color: "#6366f1", glow: "rgba(99,102,241,0.35)" },
  suspicious: { color: "#ef4444", glow: "rgba(239,68,68,0.35)"  },
  uncertain:  { color: "#f59e0b", glow: "rgba(245,158,11,0.35)" },
  credible:   { color: "#10b981", glow: "rgba(16,185,129,0.35)" },
  clickable:  { color: "#a5b4fc", glow: "rgba(165,180,252,0.3)" },
}

function getColorType(el) {
  if (!el) return "default"
  const walk = el.closest("[data-cursor]")
  if (walk) return walk.dataset.cursor
  if (el.closest("a, button, [role='button'], [tabindex]")) return "clickable"
  const cls = el.className || ""
  if (typeof cls === "string") {
    if (cls.includes("suspicious") || cls.includes("badge-suspicious")) return "suspicious"
    if (cls.includes("uncertain")  || cls.includes("badge-uncertain"))  return "uncertain"
    if (cls.includes("credible")   || cls.includes("badge-credible"))   return "credible"
  }
  return "default"
}

export default function CursorGlow() {
  const dotRef   = useRef(null)
  const glowRef  = useRef(null)
  const posRef   = useRef({ x: -100, y: -100 })
  const glowPos  = useRef({ x: -100, y: -100 })
  const rafRef   = useRef(null)
  const [visible, setVisible] = useState(false)
  const [colorKey, setColorKey] = useState("default")

  // Hide on touch devices
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return

    const onMove = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      setVisible(true)
      setColorKey(getColorType(e.target))
    }
    const onLeave = () => setVisible(false)

    document.addEventListener("mousemove", onMove, { passive: true })
    document.addEventListener("mouseleave", onLeave)

    // Animate glow trailing dot
    const animate = () => {
      const lerp = 0.1
      glowPos.current.x += (posRef.current.x - glowPos.current.x) * lerp
      glowPos.current.y += (posRef.current.y - glowPos.current.y) * lerp

      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${posRef.current.x - 4}px, ${posRef.current.y - 4}px)`
      }
      if (glowRef.current) {
        glowRef.current.style.transform =
          `translate(${glowPos.current.x - 16}px, ${glowPos.current.y - 16}px)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseleave", onLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const { color, glow } = COLORS[colorKey] || COLORS.default

  return (
    <>
      {/* Sharp dot — snaps to cursor */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0, left: 0,
          width: 8, height: 8,
          borderRadius: "50%",
          background: color,
          pointerEvents: "none",
          zIndex: 9999,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.2s, background 0.3s",
          willChange: "transform",
          mixBlendMode: "screen",
        }}
      />
      {/* Soft glow — lags behind */}
      <div
        ref={glowRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0, left: 0,
          width: 32, height: 32,
          borderRadius: "50%",
          background: glow,
          pointerEvents: "none",
          zIndex: 9998,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.2s, background 0.3s",
          willChange: "transform",
          filter: "blur(8px)",
          mixBlendMode: "screen",
        }}
      />
    </>
  )
}
