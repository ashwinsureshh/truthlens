import { useState } from "react"

export default function SentenceHighlights({ sentences }) {
  const [expanded, setExpanded] = useState(null)

  if (!sentences?.length) return null

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="flex gap-5 mb-5">
        {[
          { label: "Credible",   color: "#10b981" },
          { label: "Uncertain",  color: "#f59e0b" },
          { label: "Suspicious", color: "#ef4444" },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: color, opacity: 0.8 }}
            />
            {label}
          </span>
        ))}
      </div>

      {sentences.map((s, i) => {
        const pct         = s.score ?? 0
        const borderColor = pct < 45 ? '#10b981' : pct < 62 ? '#f59e0b' : '#ef4444'
        const scoreColor  = pct < 45 ? '#10b981' : pct < 62 ? '#f59e0b' : '#ef4444'
        const bgAlpha     = pct < 45 ? 0.04 : pct < 62 ? 0.03 : 0.02

        return (
          <div
            key={i}
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="rounded-lg p-4 cursor-pointer transition-all duration-200"
            style={{
              borderTop: `1px solid var(--border)`,
              borderRight: `1px solid var(--border)`,
              borderBottom: `1px solid var(--border)`,
              borderLeft: `3px solid ${borderColor}`,
              background: "var(--surface)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--border-strong)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                {s.sentence}
              </p>
              <span className="text-sm font-bold font-mono shrink-0" style={{ color: scoreColor }}>
                {pct.toFixed(0)}
              </span>
            </div>

            {expanded === i && s.explanation && (
              <p
                className="mt-3 text-xs leading-relaxed pt-3"
                style={{
                  color: "var(--text-3)",
                  borderTop: "1px solid var(--border)"
                }}
              >
                {s.explanation}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
