import { useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

/**
 * StreamingOverlay
 * ----------------
 * Full-screen overlay shown while analysis is streaming.
 * Sentences light up one-by-one as the backend scores them.
 *
 * Props come from useStreamingAnalysis() hook.
 */

const DIMS = [
  { key: "sensationalism", label: "Sensationalism", color: "#f97316" },
  { key: "bias",           label: "Bias",            color: "#a855f7" },
  { key: "emotion",        label: "Emotion",         color: "#ec4899" },
  { key: "factual",        label: "Factual Risk",    color: "#ef4444" },
]

function scoreColor(s) {
  if (s == null) return "rgba(255,255,255,0.04)"
  if (s < 45)    return "rgba(16, 185, 129, 0.18)"   // green
  if (s < 62)    return "rgba(245, 158, 11, 0.22)"   // amber
  return "rgba(239, 68, 68, 0.25)"                    // red
}
function scoreBorder(s) {
  if (s == null) return "rgba(255,255,255,0.06)"
  if (s < 45)    return "rgba(16, 185, 129, 0.55)"
  if (s < 62)    return "rgba(245, 158, 11, 0.65)"
  return "rgba(239, 68, 68, 0.7)"
}
function scoreText(s) {
  if (s == null) return "rgba(255,255,255,0.45)"
  if (s < 45)    return "#10b981"
  if (s < 62)    return "#f59e0b"
  return "#ef4444"
}

export default function StreamingOverlay({
  open, meta, source, dimensions, sentences, progress, final, error, onCancel,
}) {
  const total    = meta?.total ?? 0
  const cached   = !!meta?.cached
  const pct      = total ? Math.min(100, Math.round((progress / total) * 100)) : 0
  const listRef  = useRef(null)
  const lastIdx  = sentences.length - 1

  // auto-scroll list as new sentences arrive
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector(`[data-sentence-idx="${lastIdx}"]`)
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [lastIdx])

  // Build placeholder rows so the list shows full skeleton up-front
  const rows = useMemo(() => {
    const out = []
    const n = Math.max(total, sentences.length)
    for (let i = 0; i < n; i++) out.push(sentences[i] || null)
    return out
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
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
          style={{
            background: "rgba(6, 8, 16, 0.78)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
          role="dialog"
          aria-label="Analyzing article in real time"
        >
          {/* animated background orbs */}
          <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 520, height: 520, left: "10%", top: "20%",
                background: "radial-gradient(circle, rgba(99,102,241,0.35), transparent 60%)",
                filter: "blur(40px)",
              }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.55, 0.85, 0.55] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 460, height: 460, right: "8%", bottom: "12%",
                background: "radial-gradient(circle, rgba(236,72,153,0.28), transparent 60%)",
                filter: "blur(40px)",
              }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.75, 0.4] }}
              transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <motion.div
            initial={{ y: 24, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 16, scale: 0.97 }}
            transition={{ type: "spring", damping: 22, stiffness: 220 }}
            className="relative w-full max-w-5xl rounded-2xl overflow-hidden"
            style={{
              background: "rgba(15, 18, 28, 0.92)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.12)",
            }}
          >
            {/* header */}
            <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <motion.div
                      className="w-3 h-3 rounded-full"
                      style={{ background: "#10b981" }}
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 w-3 h-3 rounded-full"
                      style={{ background: "#10b981" }}
                      animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-wide" style={{ color: "rgba(255,255,255,0.96)" }}>
                      {final ? "Analysis Complete" : cached ? "Replaying Cached Result" : "Live Analysis"}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {final ? "Loading results page…" : `Scoring sentence ${Math.min(progress + (final ? 0 : 1), Math.max(total, 1))} of ${total || "…"}`}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs px-3 py-1.5 rounded-md transition-colors"
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  Cancel
                </button>
              </div>

              {/* source credibility row (URL inputs, known domains) */}
              {source?.known && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="mt-3 flex items-center gap-2 flex-wrap text-[11px]"
                >
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>Source:</span>
                  <span className="font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>
                    {source.name || source.domain}
                  </span>
                  {source.trust_display && (
                    <span
                      className="px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1"
                      style={{
                        background: `${source.trust_display.color}26`,
                        color: source.trust_display.color,
                        border: `1px solid ${source.trust_display.color}55`,
                      }}
                    >
                      <span className="w-1 h-1 rounded-full" style={{ background: source.trust_display.color }} />
                      {source.trust_display.label}
                    </span>
                  )}
                  {source.bias_display && (
                    <span
                      className="px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: `${source.bias_display.color}26`,
                        color: source.bias_display.color,
                        border: `1px solid ${source.bias_display.color}55`,
                      }}
                    >
                      {source.bias_display.label}
                    </span>
                  )}
                </motion.div>
              )}

              {/* progress bar */}
              <div className="mt-4 h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #6366f1, #ec4899, #f59e0b)",
                    backgroundSize: "200% 100%",
                  }}
                  animate={{ width: `${pct}%`, backgroundPosition: ["0% 0%", "100% 0%"] }}
                  transition={{
                    width: { duration: 0.4, ease: "easeOut" },
                    backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" },
                  }}
                />
              </div>
            </div>

            {/* dimension bars */}
            <div className="px-6 pt-5 pb-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DIMS.map((d) => {
                const v = dimensions?.[d.key]
                return (
                  <div key={d.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {d.label}
                      </span>
                      <span className="text-xs tabular-nums font-semibold" style={{ color: v != null ? d.color : "rgba(255,255,255,0.3)" }}>
                        {v != null ? Math.round(v) : "—"}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: d.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${v ?? 0}%` }}
                        transition={{ type: "spring", damping: 18, stiffness: 120 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* sentence list */}
            <div
              ref={listRef}
              className="px-6 py-5 max-h-[52vh] overflow-y-auto custom-scroll"
              style={{ scrollBehavior: "smooth" }}
            >
              {rows.length === 0 && !error && (
                <div className="text-center py-10 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Connecting to analyzer…
                </div>
              )}
              <ol className="space-y-2.5">
                {rows.map((s, i) => (
                  <li
                    key={i}
                    data-sentence-idx={i}
                    className="flex items-start gap-3"
                  >
                    <span
                      className="shrink-0 mt-0.5 w-6 h-6 rounded-md text-[11px] font-mono flex items-center justify-center tabular-nums"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(255,255,255,0.45)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <motion.div
                      initial={false}
                      animate={{
                        background: scoreColor(s?.score),
                        borderColor: scoreBorder(s?.score),
                      }}
                      transition={{ duration: 0.35 }}
                      className="flex-1 px-3.5 py-2.5 rounded-lg text-sm leading-relaxed border"
                      style={{ color: s ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.25)" }}
                    >
                      {s ? (
                        <div className="flex items-start justify-between gap-3">
                          <span>{s.text}</span>
                          <motion.span
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="shrink-0 text-[11px] font-bold tabular-nums"
                            style={{ color: scoreText(s.score) }}
                          >
                            {Math.round(s.score)}
                          </motion.span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.25)" }} />
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} />
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
                          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>queued</span>
                        </div>
                      )}
                    </motion.div>
                  </li>
                ))}
              </ol>
            </div>

            {/* footer / error */}
            <div className="px-6 py-3 border-t flex items-center justify-between gap-4 text-[11px]"
                 style={{ borderColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>
              <div className="flex items-center gap-3">
                <span className="uppercase tracking-[0.18em]">Powered by RoBERTa + MiniLM NLI</span>
              </div>
              <div className="tabular-nums">
                {progress}/{total || "?"} scored · {pct}%
              </div>
            </div>

            {error && (
              <div className="px-6 py-3 text-sm border-t" style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#fca5a5" }}>
                {error}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
