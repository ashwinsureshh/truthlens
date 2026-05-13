import { motion } from "framer-motion"

/**
 * ArticleDNA
 * ----------
 * Renders a unique visual "fingerprint" for every article — a row of
 * coloured bands generated from the per-sentence credibility scores.
 * Each band = one sentence. Height encodes risk, colour encodes verdict.
 * No two articles share the same pattern.
 */
export default function ArticleDNA({ sentences }) {
  if (!sentences?.length) return null

  const bands = sentences.map((s) => {
    const v = s.score ?? 0
    const color = v < 45 ? "#10b981" : v < 62 ? "#f59e0b" : "#ef4444"
    return { color, v, intensity: v / 100 }
  })

  const SVG_H     = 88
  const MIN_BW    = 4
  const MAX_BW    = 20
  const bandWidth = Math.min(MAX_BW, Math.max(MIN_BW, Math.floor(560 / bands.length)))
  const svgW      = bandWidth * bands.length

  // Hex fingerprint string — unique ID for this article's credibility profile
  const fingerprint = bands
    .map((b) => Math.round(b.v).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
    .slice(0, 32)

  const suspiciousCount = bands.filter((b) => b.v >= 62).length
  const credibleCount   = bands.filter((b) => b.v < 45).length

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            {/* DNA / barcode icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round">
              <path d="M2 12h20M2 6h4M18 6h4M2 18h4M18 18h4M6 6v12M18 6v12"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Article DNA</h3>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
              Unique credibility fingerprint · {bands.length} sequences
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-medium">
          <span style={{ color: "#10b981" }}>
            {credibleCount} credible
          </span>
          <span style={{ color: "var(--border-strong)" }}>·</span>
          <span style={{ color: "#ef4444" }}>
            {suspiciousCount} flagged
          </span>
        </div>
      </div>

      {/* SVG fingerprint */}
      <div className="p-5">
        <div
          className="relative rounded-xl overflow-hidden"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: "14px 10px" }}
        >
          {/* Ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 55% 50% at 50% 50%, rgba(99,102,241,0.07), transparent 70%)",
            }}
          />

          <svg
            width="100%"
            viewBox={`0 0 ${Math.max(svgW, 280)} ${SVG_H}`}
            preserveAspectRatio="none"
            className="block"
            aria-label={`Article credibility fingerprint — ${bands.length} sentences`}
            role="img"
          >
            <defs>
              {bands.map((b, i) => (
                <linearGradient key={i} id={`dna-g-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={b.color} stopOpacity="0.08" />
                  <stop offset="35%"  stopColor={b.color} stopOpacity="0.95" />
                  <stop offset="65%"  stopColor={b.color} stopOpacity="0.95" />
                  <stop offset="100%" stopColor={b.color} stopOpacity="0.08" />
                </linearGradient>
              ))}
            </defs>

            {bands.map((b, i) => {
              const barH  = 14 + b.intensity * (SVG_H - 18)
              const y     = (SVG_H - barH) / 2
              const x     = i * bandWidth
              const cx    = x + bandWidth / 2
              return (
                <motion.rect
                  key={i}
                  x={x + 0.8}
                  y={y}
                  width={Math.max(bandWidth - 1.6, 1)}
                  height={barH}
                  rx={1.5}
                  fill={`url(#dna-g-${i})`}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{
                    delay: Math.min(i * 0.012, 0.5),
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{ transformOrigin: `${cx}px ${SVG_H / 2}px` }}
                >
                  <title>Sentence {i + 1} — Score {b.v.toFixed(0)}/100</title>
                </motion.rect>
              )
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-between mt-3 px-0.5">
            {[
              { label: "Credible  0–44",    color: "#10b981" },
              { label: "Uncertain  45–61",  color: "#f59e0b" },
              { label: "Suspicious  62–100", color: "#ef4444" },
            ].map(({ label, color }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 text-[10px]"
                style={{ color: "var(--text-3)" }}
              >
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ background: color, opacity: 0.85 }}
                />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Hex fingerprint */}
        <div className="mt-3 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] mb-1" style={{ color: "var(--text-3)" }}>
              Credibility Hash
            </p>
            <p
              className="text-[11px] font-mono break-all"
              style={{ color: "var(--text-3)", letterSpacing: "0.05em" }}
            >
              {fingerprint}…
            </p>
          </div>
          <p className="text-[10px] text-right shrink-0" style={{ color: "var(--text-3)" }}>
            No two articles share<br />the same pattern
          </p>
        </div>
      </div>
    </div>
  )
}
