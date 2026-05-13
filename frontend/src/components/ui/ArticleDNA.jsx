import { motion } from "framer-motion"

/**
 * ArticleDNA — v2 (minimal)
 * -------------------------
 * EKG-style spectrogram. Each bar = one sentence.
 * Height = risk intensity. Colour = verdict tier.
 * Bars grow from the baseline on mount — staggered, snappy.
 */
export default function ArticleDNA({ sentences }) {
  if (!sentences?.length) return null

  const bands = sentences.map((s) => {
    const v = s.score ?? 0
    const color =
      v < 45  ? "#10b981"
      : v < 62 ? "#f59e0b"
               : "#ef4444"
    return { color, v, pct: v / 100 }
  })

  const SVG_H   = 72          // total SVG height
  const BASE_H  = 6           // minimum bar height (always visible)
  const MAX_H   = SVG_H - 2   // max bar height
  const BAR_W   = 6           // fixed bar width  px
  const GAP     = 3           // gap between bars px
  const STEP    = BAR_W + GAP
  const svgW    = bands.length * STEP

  const fingerprint = bands
    .map((b) => Math.round(b.v).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
    .slice(0, 36)

  const suspicious = bands.filter((b) => b.v >= 62).length
  const credible   = bands.filter((b) => b.v <  45).length

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* ── Header ── */}
      <div
        className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="#6366f1" strokeWidth="2" strokeLinecap="round">
            <path d="M2 12h20M2 6h4M18 6h4M2 18h4M18 18h4M6 6v12M18 6v12"/>
          </svg>
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Article DNA
          </span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)" }}
          >
            {bands.length} seq
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span style={{ color: "#10b981" }}>{credible} credible</span>
          <span style={{ color: "var(--border-strong)" }}>·</span>
          <span style={{ color: "#ef4444" }}>{suspicious} flagged</span>
        </div>
      </div>

      {/* ── Spectrogram ── */}
      <div className="px-5 pt-5 pb-4">
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            padding: "16px 14px 12px",
          }}
        >
          {/* Horizontal reference lines */}
          {[0.25, 0.5, 0.75].map((t) => (
            <div
              key={t}
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: `${16 + t * SVG_H}px`,
                borderTop: "1px dashed var(--border)",
                opacity: 0.5,
              }}
            />
          ))}

          {/* SVG bars */}
          <svg
            width="100%"
            viewBox={`0 0 ${Math.max(svgW, 200)} ${SVG_H}`}
            preserveAspectRatio="xMidYMax meet"
            className="block relative z-10"
            aria-label={`Credibility fingerprint — ${bands.length} sentences`}
            role="img"
          >
            {bands.map((b, i) => {
              const barH = BASE_H + b.pct * (MAX_H - BASE_H)
              const x    = i * STEP
              const y    = SVG_H - barH
              return (
                <motion.rect
                  key={i}
                  x={x}
                  y={y}
                  width={BAR_W}
                  height={barH}
                  rx={1.5}
                  fill={b.color}
                  fillOpacity={0.82}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{
                    delay: i * 0.018,
                    duration: 0.38,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{ transformOrigin: `${x + BAR_W / 2}px ${SVG_H}px` }}
                >
                  <title>Sentence {i + 1} · Score {b.v.toFixed(0)}</title>
                </motion.rect>
              )
            })}

            {/* Baseline */}
            <line
              x1={0} y1={SVG_H}
              x2={Math.max(svgW, 200)} y2={SVG_H}
              stroke="var(--border-strong)"
              strokeWidth={1}
              opacity={0.5}
            />
          </svg>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-3">
            {[
              { label: "Credible",   color: "#10b981" },
              { label: "Uncertain",  color: "#f59e0b" },
              { label: "Suspicious", color: "#ef4444" },
            ].map(({ label, color }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 text-[10px]"
                style={{ color: "var(--text-3)" }}
              >
                <span
                  className="inline-block rounded-sm"
                  style={{ width: 8, height: 8, background: color, opacity: 0.85 }}
                />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Hash */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <span
            className="text-[10px] font-mono tracking-wide"
            style={{ color: "var(--text-3)" }}
          >
            {fingerprint}…
          </span>
          <span className="text-[10px] shrink-0" style={{ color: "var(--text-3)" }}>
            unique fingerprint
          </span>
        </div>
      </div>
    </div>
  )
}
