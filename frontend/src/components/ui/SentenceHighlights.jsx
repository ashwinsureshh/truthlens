import { useState } from "react"

export default function SentenceHighlights({ sentences }) {
  const [expanded, setExpanded] = useState(null)

  if (!sentences?.length) return null

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="flex gap-5 mb-5">
        {[
          { label: "CREDIBLE",   opacity: "opacity-90" },
          { label: "UNCERTAIN",  opacity: "opacity-50" },
          { label: "SUSPICIOUS", opacity: "opacity-20" },
        ].map(({ label, opacity }) => (
          <span key={label} className="flex items-center gap-1.5 font-terminal text-[9px] tracking-widest text-white/30">
            <span className={`w-2 h-2 rounded-sm bg-white ${opacity}`} />
            {label}
          </span>
        ))}
      </div>

      {sentences.map((s, i) => {
        const pct      = s.score ?? 0
        const isGood   = pct < 40
        const isMid    = pct >= 40 && pct < 70
        const borderOp = isGood ? "border-white/40" : isMid ? "border-white/20" : "border-white/08"
        const bgOp     = isGood ? "bg-white/[0.04]" : isMid ? "bg-white/[0.02]" : "bg-transparent"
        const scoreOp  = isGood ? "text-white" : isMid ? "text-white/50" : "text-white/25"

        return (
          <div
            key={i}
            onClick={() => setExpanded(expanded === i ? null : i)}
            className={`rounded-sm p-4 cursor-pointer transition-all duration-200 border-l-2 border-y border-r ${borderOp} ${bgOp} hover:bg-white/[0.04]`}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-[12px] font-terminal text-white/70 leading-relaxed">{s.sentence}</p>
              <span className={`text-xs font-terminal font-bold shrink-0 ${scoreOp}`}>
                {pct.toFixed(0)}
              </span>
            </div>

            {expanded === i && s.explanation && (
              <p className="mt-3 text-[10px] font-terminal text-white/25 border-t border-white/[0.05] pt-3 leading-relaxed">
                &gt; {s.explanation}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
