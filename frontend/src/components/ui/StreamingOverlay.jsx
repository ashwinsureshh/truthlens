import { useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

/**
 * StreamingOverlay (v2)
 * ---------------------
 * Article reveals itself sentence-by-sentence as RoBERTa scores each one.
 * Each sentence gets a subtle inline highlight — green / amber / red —
 * as it arrives, so the user watches the article being credibility-marked
 * in real time. Like a teacher annotating a paper live.
 *
 * Uses the site's CSS variables so it adapts to light + dark mode.
 */

const DIMS = [
  { key: "sensationalism", label: "Sensationalism", color: "#f97316" },
  { key: "bias",           label: "Bias",            color: "#a855f7" },
  { key: "emotion",        label: "Emotion",         color: "#ec4899" },
  { key: "factual",        label: "Factual Risk",    color: "#ef4444" },
]

function colorFor(score) {
  if (score == null) return null
  if (score < 45) return { hue: "#10b981", soft: "rgba(16,185,129,0.10)",  ring: "rgba(16,185,129,0.45)" }
  if (score < 62) return { hue: "#f59e0b", soft: "rgba(245,158,11,0.10)", ring: "rgba(245,158,11,0.55)" }
  return                  { hue: "#ef4444", soft: "rgba(239,68,68,0.12)",  ring: "rgba(239,68,68,0.55)" }
}

function verdictFor(progress, sentences) {
  // running average of scores so far
  const scored = sentences.filter(Boolean)
  if (scored.length === 0) return { label: "Analyzing…", color: "#6366f1" }
  const avg = scored.reduce((s, x) => s + x.score, 0) / scored.length
  if (avg < 45) return { label: "Trending Credible",  color: "#10b981" }
  if (avg < 62) return { label: "Trending Uncertain", color: "#f59e0b" }
  return                { label: "Trending Suspicious", color: "#ef4444" }
}


export default function StreamingOverlay({
  open, meta, source, dimensions, sentences, progress, final, error, onCancel,
}) {
  const total      = meta?.total ?? 0
  const cached     = !!meta?.cached
  const pct        = total ? Math.min(100, Math.round((progress / total) * 100)) : 0
  const articleRef = useRef(null)
  const lastScoredIdx = sentences.reduce((acc, s, i) => s ? i : acc, -1)
  const verdict    = verdictFor(progress, sentences)

  // Auto-scroll to keep the latest scored sentence visible
  useEffect(() => {
    if (!articleRef.current) return
    const el = articleRef.current.querySelector(`[data-idx="${lastScoredIdx}"]`)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [lastScoredIdx])

  const rows = useMemo(() => {
    const n = Math.max(total, sentences.length)
    return Array.from({ length: n }, (_, i) => sentences[i] || null)
  }, [sentences, total])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="streaming-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
          style={{
            background: "color-mix(in srgb, var(--bg) 82%, transparent)",
            backdropFilter: "blur(18px) saturate(140%)",
            WebkitBackdropFilter: "blur(18px) saturate(140%)",
          }}
          role="dialog"
          aria-label="Analyzing article in real time"
        >
          {/* Soft accent glow behind the panel */}
          <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 600, height: 600, left: "10%", top: "15%",
                background: "radial-gradient(circle, rgba(99,102,241,0.18), transparent 60%)",
                filter: "blur(60px)",
              }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 500, height: 500, right: "8%", bottom: "10%",
                background: `radial-gradient(circle, ${verdict.color}33, transparent 60%)`,
                filter: "blur(60px)",
              }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.45, 0.75, 0.45] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <motion.div
            initial={{ y: 20, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 14, scale: 0.97 }}
            transition={{ type: "spring", damping: 22, stiffness: 220 }}
            className="relative w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              maxHeight: "90vh",
              boxShadow: "0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px var(--border)",
            }}
          >
            {/* ─── HEADER ─── */}
            <div className="px-5 sm:px-7 pt-5 pb-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <motion.span
                      className="block w-2 h-2 rounded-full"
                      style={{ background: verdict.color }}
                      animate={{ scale: [1, 1.6, 1], opacity: [1, 0.55, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                    <motion.span
                      className="absolute inset-0 w-2 h-2 rounded-full"
                      style={{ background: verdict.color }}
                      animate={{ scale: [1, 2.6], opacity: [0.6, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold leading-tight truncate" style={{ color: "var(--text)" }}>
                      {final ? "Analysis complete" : cached ? "Replaying cached result" : "Analyzing article"}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.16em] mt-0.5"
                         style={{ color: verdict.color, opacity: 0.85 }}>
                      {final ? "Loading results…" : verdict.label}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] font-medium tabular-nums px-2.5 py-1 rounded-md"
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--text-2)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {progress}/{total || "…"}
                  </span>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors"
                    style={{
                      color: "var(--text-2)",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Source badge inline */}
              {source?.known && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="mt-3 flex items-center gap-1.5 flex-wrap text-[11px]"
                >
                  <span style={{ color: "var(--text-3)" }}>Source:</span>
                  <span className="font-semibold" style={{ color: "var(--text)" }}>
                    {source.name || source.domain}
                  </span>
                  {source.trust_display && (
                    <span
                      className="px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: `${source.trust_display.color}1f`,
                        color: source.trust_display.color,
                        border: `1px solid ${source.trust_display.color}55`,
                      }}
                    >
                      {source.trust_display.label}
                    </span>
                  )}
                  {source.bias_display && (
                    <span
                      className="px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: `${source.bias_display.color}1f`,
                        color: source.bias_display.color,
                        border: `1px solid ${source.bias_display.color}55`,
                      }}
                    >
                      {source.bias_display.label}
                    </span>
                  )}
                </motion.div>
              )}

              {/* Progress bar */}
              <div className="mt-4 h-1 w-full rounded-full overflow-hidden"
                   style={{ background: "var(--surface-2)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, #6366f1, ${verdict.color})`,
                    backgroundSize: "200% 100%",
                  }}
                  animate={{
                    width: `${pct}%`,
                    backgroundPosition: ["0% 0%", "100% 0%"],
                  }}
                  transition={{
                    width: { duration: 0.4, ease: "easeOut" },
                    backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" },
                  }}
                />
              </div>

              {/* Dimension chips */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DIMS.map((d) => {
                  const v = dimensions?.[d.key]
                  const ready = v != null
                  return (
                    <div
                      key={d.key}
                      className="px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2"
                      style={{
                        background: "var(--surface-2)",
                        border: `1px solid ${ready ? d.color + "33" : "var(--border)"}`,
                        transition: "border-color 0.4s",
                      }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: ready ? d.color : "var(--text-3)" }}
                        />
                        <span className="text-[10px] uppercase tracking-wider truncate"
                              style={{ color: "var(--text-2)" }}>
                          {d.label}
                        </span>
                      </div>
                      <span
                        className="text-[12px] font-bold tabular-nums shrink-0"
                        style={{ color: ready ? d.color : "var(--text-3)" }}
                      >
                        {ready ? Math.round(v) : "—"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px w-full" style={{ background: "var(--border)" }} />

            {/* ─── ARTICLE BODY (flowing paragraph reveal) ─── */}
            <div
              ref={articleRef}
              className="px-5 sm:px-7 py-5 overflow-y-auto custom-scroll grow"
              style={{ minHeight: 280 }}
            >
              {rows.length === 0 && !error && (
                <div className="text-center py-10 text-sm" style={{ color: "var(--text-3)" }}>
                  Connecting to analyzer…
                </div>
              )}

              <p
                className="text-[15px] leading-[1.85]"
                style={{
                  color: "var(--text)",
                  fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
                  textAlign: "left",
                }}
              >
                {rows.map((s, i) => {
                  const c = colorFor(s?.score)
                  const isCurrent = !s && i === lastScoredIdx + 1

                  if (!s) {
                    // Un-scored placeholder: subtle dotted underline to suggest "queued"
                    return (
                      <motion.span
                        key={i}
                        data-idx={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isCurrent ? 1 : 0.35 }}
                        transition={{ duration: 0.3 }}
                        className="inline-block align-baseline mr-1"
                        style={{
                          color: "var(--text-3)",
                          borderBottom: isCurrent
                            ? "2px solid #6366f1"
                            : "1px dashed var(--border-strong)",
                          paddingBottom: 1,
                        }}
                      >
                        {isCurrent ? (
                          <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                          >
                            scoring sentence {i + 1}…
                          </motion.span>
                        ) : (
                          <span>· · · · · · · ·</span>
                        )}
                      </motion.span>
                    )
                  }

                  return (
                    <motion.span
                      key={i}
                      data-idx={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="inline relative"
                      style={{
                        background: c?.soft,
                        borderRadius: 4,
                        padding: "2px 6px",
                        margin: "0 1px",
                        boxShadow: `inset 3px 0 0 ${c?.hue}`,
                      }}
                    >
                      {s.text}
                      {/* Score pill — only show when meaningfully high or low */}
                      {(s.score >= 62 || s.score < 30) && (
                        <motion.sup
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 }}
                          className="text-[10px] font-bold tabular-nums ml-1 px-1.5 py-0.5 rounded"
                          style={{
                            background: c?.hue,
                            color: "white",
                            verticalAlign: "super",
                            top: 0,
                          }}
                        >
                          {Math.round(s.score)}
                        </motion.sup>
                      )}
                    </motion.span>
                  )
                })}
              </p>
            </div>

            {/* ─── FOOTER ─── */}
            <div
              className="px-5 sm:px-7 py-2.5 flex items-center justify-between gap-3 text-[10px]"
              style={{
                borderTop: "1px solid var(--border)",
                color: "var(--text-3)",
                background: "var(--surface-2)",
              }}
            >
              <span className="uppercase tracking-[0.18em]">RoBERTa · MiniLM NLI</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} /> Credible
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#f59e0b" }} /> Uncertain
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#ef4444" }} /> Suspicious
                </span>
              </div>
            </div>

            {error && (
              <div
                className="px-5 sm:px-7 py-3 text-sm"
                style={{
                  borderTop: "1px solid rgba(239,68,68,0.4)",
                  background: "rgba(239,68,68,0.08)",
                  color: "#dc2626",
                }}
              >
                {error}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
