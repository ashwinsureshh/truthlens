import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { getAnalysis } from "../services/api"
import CredibilityGauge from "../components/charts/CredibilityGauge"

export default function ReportCard() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getAnalysis(id)
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load analysis."))
      .finally(() => setLoading(false))
  }, [id])

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="flex gap-1.5">
          <span className="dot-bounce w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
          <span className="dot-bounce w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
          <span className="dot-bounce w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="card p-10 text-center max-w-sm w-full">
          <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>{error}</p>
          <Link to="/" className="btn-outline px-5 py-2 text-sm inline-flex items-center gap-2">
            ← New Analysis
          </Link>
        </div>
      </div>
    )
  }

  const { overall_score, scores, sentence_results, sentence_count } = data
  const score = overall_score
  const label = score < 45 ? "Credible" : score < 62 ? "Uncertain" : "Suspicious"
  const verdictColor = score < 45 ? "#10b981" : score < 62 ? "#f59e0b" : "#ef4444"
  const badgeClass = score < 45 ? "badge-credible" : score < 62 ? "badge-uncertain" : "badge-suspicious"

  // Top 3 red flags — sentences sorted by score descending
  const redFlags = [...(sentence_results || [])]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3)
    .filter((s) => (s.score ?? 0) >= 45)

  const DIM_LABELS = {
    sensationalism: "Sensationalism",
    bias: "Bias",
    emotion: "Emotion",
    factual: "Fact Risk",
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg"
            style={{ background: "#6366f1", color: "white" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Link copied!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg"
        >
          {/* Main card */}
          <div
            className="rounded-2xl overflow-hidden shadow-xl"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Header stripe */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
                  <circle cx="20" cy="20" r="20" fill="#6366f1" />
                  <circle cx="20" cy="20" r="19" fill="#1e1b4b" />
                  <path d="M14.5 14.5 A8 8 0 0 0 14.5 25.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                  <path d="M11.5 11.5 A12 12 0 0 0 11.5 28.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                  <path d="M8.5 8.5  A16 16 0 0 0 8.5 31.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                  <path d="M16 20 C18 15.5 26 15.5 30 20 C26 24.5 18 24.5 16 20 Z" fill="white" />
                  <circle cx="25" cy="20" r="3.2" fill="#1e1b4b" />
                  <circle cx="26" cy="18.8" r="1.1" fill="white" />
                </svg>
                <div>
                  <span className="text-sm font-bold" style={{ color: "var(--text)" }}>TruthLens</span>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>AI Credibility Report</p>
                </div>
              </div>
              <span className="text-xs font-mono" style={{ color: "var(--text-3)" }}>#{id}</span>
            </div>

            <div className="p-6 space-y-6">
              {/* Score gauge */}
              <div className="flex flex-col items-center py-4">
                <CredibilityGauge score={overall_score} />
                <div className="mt-3 text-center">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: verdictColor }}
                  >
                    {label}
                  </span>
                  <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                    {sentence_count ?? "—"} sentences analyzed
                  </p>
                </div>
              </div>

              {/* Verdict explanation */}
              <div
                className="rounded-xl px-4 py-3.5"
                style={{
                  background: `${verdictColor}10`,
                  border: `1px solid ${verdictColor}30`,
                }}
              >
                <p className="text-xs font-semibold mb-0.5" style={{ color: verdictColor }}>
                  {score < 45 ? "✓ Content appears credible" : score < 62 ? "⚠ Exercise caution" : "✕ High misinformation risk"}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                  {score < 45
                    ? "Low bias, factual language, and minimal sensationalism detected."
                    : score < 62
                    ? "Mixed signals detected — cross-reference with trusted news outlets before sharing."
                    : "Strong indicators of bias, emotional manipulation, or false claims detected."}
                </p>
              </div>

              {/* Dimension scores */}
              {scores && (
                <div>
                  <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-3)" }}>
                    Dimension Scores
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(scores).map(([key, val]) => {
                      const c = (val ?? 0) < 25 ? "#10b981" : (val ?? 0) < 50 ? "#f59e0b" : "#ef4444"
                      return (
                        <div
                          key={key}
                          className="rounded-xl px-3 py-2.5"
                          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                        >
                          <p className="text-xs mb-1" style={{ color: "var(--text-3)" }}>{DIM_LABELS[key] ?? key}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: (val ?? 0) + "%" }}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                className="h-full rounded-full"
                                style={{ background: c }}
                              />
                            </div>
                            <span className="text-xs font-bold font-mono shrink-0" style={{ color: c }}>
                              {(val ?? 0).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Red flags */}
              {redFlags.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-3)" }}>
                    Top Red Flags
                  </p>
                  <div className="space-y-2">
                    {redFlags.map((s, i) => {
                      const sColor = (s.score ?? 0) < 45 ? "#10b981" : (s.score ?? 0) < 62 ? "#f59e0b" : "#ef4444"
                      return (
                        <div
                          key={i}
                          className="rounded-xl px-4 py-3"
                          style={{
                            background: "rgba(239,68,68,0.05)",
                            border: "1px solid rgba(239,68,68,0.15)",
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
                            >
                              {i + 1}
                            </span>
                            <span className="text-xs font-mono" style={{ color: sColor }}>
                              Score: {(s.score ?? 0).toFixed(1)}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--text-2)" }}>
                            "{s.sentence || s.text}"
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-2)",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--border-strong)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
                  </svg>
                  Share
                </button>
                <Link
                  to={`/results/${id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "#6366f1", color: "white" }}
                >
                  View Full Report →
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-6 py-3 flex items-center justify-center gap-1.5"
              style={{
                borderTop: "1px solid var(--border)",
                background: "var(--surface-2)",
              }}
            >
              <span className="text-xs" style={{ color: "var(--text-3)" }}>
                Analyzed by TruthLens · truthlens.ai
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
