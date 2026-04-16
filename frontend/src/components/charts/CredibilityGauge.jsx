import { useState, useEffect } from "react"
import { motion, animate, AnimatePresence } from "framer-motion"

export default function CredibilityGauge({ score = 0 }) {
  const pct    = Math.min(100, Math.max(0, score))
  const radius = 54
  const stroke = 5
  const circ   = 2 * Math.PI * radius
  const arc    = circ * 0.75
  const offset = arc - (arc * pct / 100)

  const color      = pct < 45 ? "#10b981" : pct < 62 ? "#f59e0b" : "#ef4444"
  const label      = pct < 45 ? "Credible" : pct < 62 ? "Uncertain" : "Suspicious"
  const badgeClass = pct < 45 ? "badge-credible" : pct < 62 ? "badge-uncertain" : "badge-suspicious"

  // Smooth count-up using framer-motion's animate()
  const [displayScore, setDisplayScore] = useState(0)
  useEffect(() => {
    setDisplayScore(0)
    const controls = animate(0, pct, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplayScore(v),
    })
    return controls.stop
  }, [pct])

  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-[135deg]">
          {/* Track */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="#94a3b8"
            strokeOpacity="0.25"
            strokeWidth={stroke}
            strokeDasharray={`${arc} ${circ}`}
            strokeLinecap="round"
          />
          {/* Fill */}
          <motion.circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${arc} ${circ}`}
            strokeLinecap="round"
            initial={{ strokeDashoffset: arc }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold font-mono"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {displayScore.toFixed(1)}
          </motion.span>
          <span className="text-xs" style={{ color: "var(--text-3)" }}>/100</span>
        </div>
      </div>

      <motion.span
        className={badgeClass}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {label}
      </motion.span>

      {/* Info icon with animated tooltip */}
      <div className="relative flex items-center justify-center">
        <motion.button
          type="button"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="flex items-center justify-center w-5 h-5 rounded-full"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--text-3)",
          }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          aria-label="Score range info"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
        </motion.button>

        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.92 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-7 left-1/2 z-50 w-52 rounded-xl px-3 py-2.5 text-xs shadow-lg"
              style={{
                transform: "translateX(-50%)",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              <p className="font-semibold mb-1.5" style={{ color: "var(--text)" }}>Score Ranges</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#10b981" }} />
                  <span><strong>0–44:</strong> Credible — High factual accuracy, low bias</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#f59e0b" }} />
                  <span><strong>45–61:</strong> Uncertain — Mixed signals, verify sources</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#ef4444" }} />
                  <span><strong>62–100:</strong> Suspicious — Possible misinformation detected</span>
                </div>
              </div>
              {/* Arrow */}
              <div
                className="absolute left-1/2 -bottom-1.5 w-2.5 h-2.5"
                style={{
                  transform: "translateX(-50%) rotate(45deg)",
                  background: "var(--surface)",
                  borderRight: "1px solid var(--border)",
                  borderBottom: "1px solid var(--border)",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
