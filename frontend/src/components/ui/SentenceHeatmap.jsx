/**
 * F-07 — Sentence Heatmap
 * Renders article text as an inline paragraph with each sentence
 * highlighted by color-intensity based on its suspicion score.
 */
export default function SentenceHeatmap({ sentences }) {
  if (!sentences?.length) return null

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-6 mb-5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-10 h-3 rounded-sm inline-block" style={{ background: "rgba(16,185,129,0.35)" }} />
          Credible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-10 h-3 rounded-sm inline-block" style={{ background: "rgba(245,158,11,0.35)" }} />
          Uncertain
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-10 h-3 rounded-sm inline-block" style={{ background: "rgba(239,68,68,0.35)" }} />
          Suspicious
        </span>
      </div>

      {/* Heatmap text */}
      <p className="text-sm leading-8 text-slate-200">
        {sentences.map((s, i) => {
          const score = s.score ?? 0
          const isCredible  = score < 40
          const isUncertain = score >= 40 && score < 70

          // Color: green → yellow → red based on score
          let bg, border
          if (isCredible) {
            const alpha = 0.1 + (score / 40) * 0.25
            bg     = `rgba(16,185,129,${alpha.toFixed(2)})`
            border = "rgba(16,185,129,0.4)"
          } else if (isUncertain) {
            const t = (score - 40) / 30
            const alpha = 0.2 + t * 0.25
            bg     = `rgba(245,158,11,${alpha.toFixed(2)})`
            border = "rgba(245,158,11,0.4)"
          } else {
            const t = (score - 70) / 30
            const alpha = 0.2 + t * 0.35
            bg     = `rgba(239,68,68,${alpha.toFixed(2)})`
            border = "rgba(239,68,68,0.4)"
          }

          return (
            <span
              key={i}
              title={`Score: ${score.toFixed(0)} — ${s.label}`}
              className="relative group cursor-default"
              style={{
                background: bg,
                borderBottom: `2px solid ${border}`,
                borderRadius: "3px",
                padding: "1px 2px",
                marginRight: "4px",
              }}
            >
              {s.sentence}

              {/* Tooltip */}
              <span className="absolute bottom-full left-0 mb-2 hidden group-hover:flex items-center gap-2 bg-[#0a1020] border border-white/10 text-xs rounded-lg px-3 py-1.5 whitespace-nowrap z-20 shadow-xl">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: isCredible ? "#10b981" : isUncertain ? "#f59e0b" : "#ef4444" }}
                />
                <span className="font-mono font-bold" style={{ color: isCredible ? "#10b981" : isUncertain ? "#f59e0b" : "#ef4444" }}>
                  {score.toFixed(0)}
                </span>
                <span className="text-slate-400 capitalize">{s.label}</span>
              </span>
            </span>
          )
        })}
      </p>
    </div>
  )
}
