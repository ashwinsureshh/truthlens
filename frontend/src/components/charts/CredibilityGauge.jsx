import { motion } from "framer-motion"

export default function CredibilityGauge({ score = 0 }) {
  const pct    = Math.min(100, Math.max(0, score))
  const radius = 54
  const stroke = 5
  const circ   = 2 * Math.PI * radius
  const arc    = circ * 0.75
  const offset = arc - (arc * pct / 100)

  const label   = pct < 30 ? "CREDIBLE" : pct < 55 ? "UNCERTAIN" : "SUSPICIOUS"
  const opacity = pct < 30 ? 1 : pct < 55 ? 0.55 : 0.3

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-[135deg]">
          {/* Track */}
          <circle cx="60" cy="60" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
            strokeDasharray={`${arc} ${circ}`}
            strokeLinecap="round"
          />
          {/* Fill */}
          <motion.circle cx="60" cy="60" r={radius}
            fill="none"
            stroke="white"
            strokeWidth={stroke}
            strokeDasharray={`${arc} ${circ}`}
            strokeLinecap="round"
            style={{ opacity }}
            initial={{ strokeDashoffset: arc }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span className="text-3xl font-bold font-terminal text-white"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          >{pct}</motion.span>
          <span className="text-[9px] font-terminal text-white/20 tracking-widest">/100</span>
        </div>
      </div>

      <span className="font-terminal text-[10px] tracking-[0.25em] uppercase px-4 py-1.5 border border-white/15 rounded-sm text-white/50">
        {label}
      </span>
    </div>
  )
}
