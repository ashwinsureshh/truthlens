export default function SentenceHeatmap({ sentences }) {
  if (!sentences?.length) return null

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-6 mb-5">
        {[
          { label: "Credible",   bg: "rgba(16,185,129,0.25)",  border: "rgba(16,185,129,0.5)"  },
          { label: "Uncertain",  bg: "rgba(245,158,11,0.2)",   border: "rgba(245,158,11,0.5)"  },
          { label: "Suspicious", bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.4)"   },
        ].map(({ label, bg, border }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
            <span
              className="w-8 h-3 rounded-sm inline-block"
              style={{ background: bg, borderBottom: `2px solid ${border}` }}
            />
            {label}
          </span>
        ))}
      </div>

      {/* Heatmap text */}
      <p className="text-sm leading-8" style={{ color: "var(--text-2)" }}>
        {sentences.map((s, i) => {
          const pct = s.score ?? 0
          const isCredible   = pct < 45
          const isUncertain  = pct >= 45 && pct < 62
          // isSuspicious is >= 55

          const bg = isCredible
            ? "rgba(16, 185, 129, 0.15)"
            : isUncertain
            ? "rgba(245, 158, 11, 0.15)"
            : "rgba(239, 68, 68, 0.15)"

          const borderColor = isCredible
            ? "rgba(16,185,129,0.4)"
            : isUncertain
            ? "rgba(245,158,11,0.4)"
            : "rgba(239,68,68,0.4)"

          const scoreColor = isCredible ? "#10b981" : isUncertain ? "#f59e0b" : "#ef4444"

          return (
            <span
              key={i}
              title={`Score: ${pct.toFixed(0)} — ${s.label}`}
              className="relative group cursor-default"
              style={{
                background: bg,
                borderBottom: `2px solid ${borderColor}`,
                borderRadius: "3px",
                padding: "1px 3px",
                marginRight: "3px",
              }}
            >
              {s.sentence}

              {/* Tooltip */}
              <span
                className="absolute bottom-full left-0 mb-2 hidden group-hover:flex items-center gap-2 text-xs rounded-lg px-3 py-1.5 whitespace-nowrap z-20"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-hover)",
                  color: "var(--text-2)"
                }}
              >
                <span style={{ color: "var(--text-3)" }}>Score</span>
                <span className="font-bold font-mono" style={{ color: scoreColor }}>{pct.toFixed(0)}</span>
                <span style={{ color: "var(--border-strong)" }}>·</span>
                <span>{s.label}</span>
              </span>
            </span>
          )
        })}
      </p>
    </div>
  )
}
