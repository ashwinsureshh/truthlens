import { useState } from "react"

const STYLES = {
  credible: {
    container: "border-l-2 border-emerald-500/50 bg-emerald-950/20 border-y border-r border-emerald-500/10 hover:bg-emerald-950/35",
    badge:     "bg-emerald-500/12 text-emerald-400 border border-emerald-500/20",
    dot:       "bg-emerald-400",
  },
  uncertain: {
    container: "border-l-2 border-amber-500/50 bg-amber-950/20 border-y border-r border-amber-500/10 hover:bg-amber-950/35",
    badge:     "bg-amber-500/12 text-amber-400 border border-amber-500/20",
    dot:       "bg-amber-400",
  },
  suspicious: {
    container: "border-l-2 border-red-500/50 bg-red-950/20 border-y border-r border-red-500/10 hover:bg-red-950/35",
    badge:     "bg-red-500/12 text-red-400 border border-red-500/20",
    dot:       "bg-red-400",
  },
}

export default function SentenceHighlights({ sentences }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="flex gap-5 mb-5">
        {[
          { key: "credible",   label: "Credible",   dot: "bg-emerald-400" },
          { key: "uncertain",  label: "Uncertain",  dot: "bg-amber-400"   },
          { key: "suspicious", label: "Suspicious", dot: "bg-red-400"     },
        ].map(({ key, label, dot }) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`w-2 h-2 rounded-full ${dot} opacity-80`} />
            {label}
          </span>
        ))}
      </div>

      {sentences.map((s, i) => {
        const style = STYLES[s.label] ?? STYLES.uncertain
        return (
          <div
            key={i}
            onClick={() => setExpanded(expanded === i ? null : i)}
            className={`rounded-xl p-4 cursor-pointer transition-all duration-200 ${style.container}`}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-slate-200 leading-relaxed">{s.sentence}</p>
              <span className={`text-xs px-2.5 py-1 rounded-lg shrink-0 font-mono font-bold ${style.badge}`}>
                {s.score.toFixed(0)}
              </span>
            </div>

            {expanded === i && s.explanation && (
              <p className="mt-3 text-xs text-slate-500 border-t border-white/5 pt-3 leading-relaxed">
                {s.explanation}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
