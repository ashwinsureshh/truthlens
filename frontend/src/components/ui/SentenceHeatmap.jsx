export default function SentenceHeatmap({ sentences }) {
  if (!sentences?.length) return null

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-6 mb-5">
        {[
          { label: "CREDIBLE",   bg: "rgba(255,255,255,0.25)" },
          { label: "UNCERTAIN",  bg: "rgba(255,255,255,0.12)" },
          { label: "SUSPICIOUS", bg: "rgba(255,255,255,0.04)" },
        ].map(({ label, bg }) => (
          <span key={label} className="flex items-center gap-1.5 font-terminal text-[9px] tracking-widest text-white/25">
            <span className="w-8 h-3 rounded-sm inline-block" style={{ background: bg }} />
            {label}
          </span>
        ))}
      </div>

      {/* Heatmap text */}
      <p className="text-[12px] font-terminal leading-8 text-white/60">
        {sentences.map((s, i) => {
          const pct     = s.score ?? 0
          const isGood  = pct < 40
          const isMid   = pct >= 40 && pct < 70
          const alpha   = isGood
            ? 0.12 + (pct / 40) * 0.15
            : isMid
            ? 0.08 + ((pct - 40) / 30) * 0.08
            : 0.02 + ((pct - 70) / 30) * 0.04

          const borderOp = isGood ? 0.4 : isMid ? 0.2 : 0.1

          return (
            <span
              key={i}
              title={`Score: ${pct.toFixed(0)} — ${s.label}`}
              className="relative group cursor-default"
              style={{
                background: `rgba(255,255,255,${alpha.toFixed(3)})`,
                borderBottom: `1px solid rgba(255,255,255,${borderOp})`,
                borderRadius: "2px",
                padding: "1px 2px",
                marginRight: "3px",
              }}
            >
              {s.sentence}

              {/* Tooltip */}
              <span className="absolute bottom-full left-0 mb-2 hidden group-hover:flex items-center gap-2 bg-black border border-white/15 font-terminal text-[10px] tracking-widest rounded-sm px-3 py-1.5 whitespace-nowrap z-20 uppercase">
                <span className="text-white/40">SCORE</span>
                <span className="text-white font-bold">{pct.toFixed(0)}</span>
                <span className="text-white/30">//</span>
                <span className="text-white/50">{s.label?.toUpperCase()}</span>
              </span>
            </span>
          )
        })}
      </p>
    </div>
  )
}
