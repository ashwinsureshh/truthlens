import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { aiRewrite } from "../../services/api"

/**
 * CredibleRewrite
 * ---------------
 * Click-to-generate panel that asks the LLM to rewrite the article in
 * a neutral, factual style — stripping bias, sensationalism, emotion.
 *
 * Side-by-side layout shows the contrast vividly during demos.
 */
export default function CredibleRewrite({ analysisId, originalText }) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [rewrite, setRewrite] = useState("")
  const [error, setError]     = useState("")

  async function generate() {
    if (rewrite || loading) { setOpen(true); return }
    setOpen(true)
    setLoading(true)
    setError("")
    try {
      const res = await aiRewrite(analysisId)
      setRewrite(res.data.rewrite || "")
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate rewrite.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #10b981, #06b6d4)",
                boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Credible Rewrite
              </h3>
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                See what this article would look like written neutrally
              </p>
            </div>
          </div>

          {!open && (
            <button
              type="button"
              onClick={generate}
              className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors inline-flex items-center gap-1.5"
              style={{
                color: "white",
                background: "linear-gradient(135deg, #10b981, #06b6d4)",
                boxShadow: "0 4px 14px rgba(16,185,129,0.25)",
              }}
            >
              Generate rewrite
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] uppercase tracking-[0.18em] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}
                    >
                      Original
                    </span>
                  </div>
                  <div
                    className="text-xs leading-relaxed p-3 rounded-lg max-h-72 overflow-y-auto custom-scroll"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-2)",
                    }}
                  >
                    {originalText || "(article text unavailable)"}
                  </div>
                </div>

                {/* Rewrite */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] uppercase tracking-[0.18em] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
                    >
                      Credible Rewrite
                    </span>
                  </div>
                  <div
                    className="text-xs leading-relaxed p-3 rounded-lg max-h-72 overflow-y-auto custom-scroll"
                    style={{
                      background: "rgba(16,185,129,0.05)",
                      border: "1px solid rgba(16,185,129,0.25)",
                      color: "var(--text-2)",
                      minHeight: 120,
                    }}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-3)" }}>
                        <span className="dot-bounce w-1 h-1 rounded-full" style={{ background: "#10b981" }} />
                        <span className="dot-bounce w-1 h-1 rounded-full" style={{ background: "#10b981" }} />
                        <span className="dot-bounce w-1 h-1 rounded-full" style={{ background: "#10b981" }} />
                        Rewriting in neutral journalistic style…
                      </div>
                    ) : error ? (
                      <span style={{ color: "#ef4444" }}>{error}</span>
                    ) : (
                      <p className="whitespace-pre-wrap">{rewrite}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                  Generated by Llama 3.3 70B · facts preserved, language neutralized
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-[11px] px-2.5 py-1 rounded-md"
                  style={{
                    color: "var(--text-3)",
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                  }}
                >
                  Hide
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
