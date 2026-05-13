import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { aiRewrite } from "../../services/api"

/**
 * BeforeAfterSlider
 * Drag the handle left/right to reveal the AI rewrite over the original.
 */
function BeforeAfterSlider({ original, rewritten }) {
  const [pos, setPos]         = useState(50)
  const [dragging, setDragging] = useState(false)
  const containerRef          = useRef(null)

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct  = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    setPos(pct)
  }, [])

  useEffect(() => {
    if (!dragging) return
    const move = (e) => handleMove(e.touches ? e.touches[0].clientX : e.clientX)
    const up   = () => setDragging(false)
    document.addEventListener("mousemove", move)
    document.addEventListener("mouseup",   up)
    document.addEventListener("touchmove", move, { passive: true })
    document.addEventListener("touchend",  up)
    return () => {
      document.removeEventListener("mousemove", move)
      document.removeEventListener("mouseup",   up)
      document.removeEventListener("touchmove", move)
      document.removeEventListener("touchend",  up)
    }
  }, [dragging, handleMove])

  return (
    <div className="mt-4 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      {/* Labels bar */}
      <div
        className="flex items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
        style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
      >
        <span style={{ color: "#ef4444" }}>◀ Original</span>
        <span style={{ color: "var(--text-3)" }}>drag to compare</span>
        <span style={{ color: "#10b981" }}>AI Rewrite ▶</span>
      </div>

      {/* Slider area */}
      <div
        ref={containerRef}
        className="relative select-none overflow-hidden"
        style={{ minHeight: 260, cursor: "ew-resize" }}
        onMouseDown={(e) => { setDragging(true); handleMove(e.clientX) }}
        onTouchStart={(e) => { setDragging(true); handleMove(e.touches[0].clientX) }}
      >
        {/* Right panel — Rewrite (always visible underneath) */}
        <div
          className="absolute inset-0 overflow-y-auto p-5 text-xs leading-7"
          style={{ background: "rgba(16,185,129,0.04)", color: "var(--text-2)" }}
        >
          {rewritten}
        </div>

        {/* Left panel — Original (clips to slider pos) */}
        <div
          className="absolute inset-0 overflow-y-auto p-5 text-xs leading-7"
          style={{
            clipPath:   `inset(0 ${100 - pos}% 0 0)`,
            background: "rgba(239,68,68,0.05)",
            color:      "var(--text-2)",
          }}
        >
          {original}
        </div>

        {/* Handle line + knob */}
        <div
          className="absolute top-0 bottom-0 z-20 flex items-center justify-center pointer-events-none"
          style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute inset-y-0 w-[2px]" style={{ background: "rgba(99,102,241,0.85)" }} />
          <div
            className="relative flex items-center justify-center w-9 h-9 rounded-full"
            style={{
              background:  "#6366f1",
              border:      "3px solid var(--surface)",
              boxShadow:   "0 0 0 2px #6366f1, 0 4px 20px rgba(99,102,241,0.55)",
              transition:  dragging ? "none" : "box-shadow 0.2s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l-6-6 6-6M15 6l6 6-6 6"/>
            </svg>
          </div>
        </div>
      </div>

      <p
        className="text-center text-[10px] py-2"
        style={{ background: "var(--surface-2)", color: "var(--text-3)", borderTop: "1px solid var(--border)" }}
      >
        Facts preserved · Sensational language neutralized by AI
      </p>
    </div>
  )
}

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
              {/* Loading / error state */}
              {(loading || error) && (
                <div
                  className="mt-4 text-xs leading-relaxed p-4 rounded-xl"
                  style={{
                    background: error ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.05)",
                    border: `1px solid ${error ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,
                    color: "var(--text-2)",
                    minHeight: 80,
                  }}
                >
                  {loading ? (
                    <div className="flex items-center gap-2" style={{ color: "var(--text-3)" }}>
                      <span className="dot-bounce w-1 h-1 rounded-full" style={{ background: "#10b981" }} />
                      <span className="dot-bounce w-1 h-1 rounded-full" style={{ background: "#10b981" }} />
                      <span className="dot-bounce w-1 h-1 rounded-full" style={{ background: "#10b981" }} />
                      Rewriting in neutral journalistic style…
                    </div>
                  ) : (
                    <span style={{ color: "#ef4444" }}>{error}</span>
                  )}
                </div>
              )}

              {/* Before / After drag slider — only when rewrite is ready */}
              {rewrite && !loading && !error && (
                <BeforeAfterSlider
                  original={originalText || "(article text unavailable)"}
                  rewritten={rewrite}
                />
              )}

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
