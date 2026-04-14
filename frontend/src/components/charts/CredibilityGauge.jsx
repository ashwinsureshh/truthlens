import { motion } from "framer-motion"

export default function CredibilityGauge({ score = 0 }) {
  const pct    = Math.min(100, Math.max(0, score))
  const radius = 54
  const stroke = 5
  const circ   = 2 * Math.PI * radius
  const arc    = circ * 0.75
  const offset = arc - (arc * pct / 100)

  const color      = pct < 30 ? "#10b981" : pct < 55 ? "#f59e0b" : "#ef4444"
  const label      = pct < 30 ? "Credible" : pct < 55 ? "Uncertain" : "Suspicious"
  const badgeClass = pct < 30 ? "badge-credible" : pct < 55 ? "badge-uncertain" : "badge-suspicious"

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
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold font-mono"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {pct}
          </motion.span>
          <span className="text-xs" style={{ color: "var(--text-3)" }}>/100</span>
        </div>
      </div>

      <span className={badgeClass}>{label}</span>
    </div>
  )
}
