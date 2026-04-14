import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { getAnalysis } from "../services/api"
import { motion, AnimatePresence } from "framer-motion"
import RadarChart from "../components/charts/RadarChart"
import CredibilityGauge from "../components/charts/CredibilityGauge"
import SentenceHighlights from "../components/ui/SentenceHighlights"
import SentenceHeatmap from "../components/ui/SentenceHeatmap"

const TABS = ["Overview", "Heatmap", "Benchmark"]

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState("")
  const [tab, setTab]         = useState("Overview")
  const [copied, setCopied]   = useState(false)

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1.5">
          <span className="dot-bounce w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
          <span className="dot-bounce w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
          <span className="dot-bounce w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
        </div>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>Loading analysis...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="card p-10 text-center max-w-sm w-full">
        <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>{error}</p>
        <Link to="/" className="btn-outline px-5 py-2 text-sm inline-flex items-center gap-2">
          ← New Analysis
        </Link>
      </div>
    </div>
  )

  const { overall_score, scores, sentence_results } = data
  const score = overall_score
  const label = score < 30 ? "Credible" : score < 55 ? "Uncertain" : "Suspicious"
  const badgeClass = score < 30 ? "badge-credible" : score < 55 ? "badge-uncertain" : "badge-suspicious"

  return (
    <div className="min-h-screen print:shadow-none" style={{ background: "var(--bg)" }}>
      {/* Toast notification */}
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
            Link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-5xl mx-auto px-4 py-10 space-y-4"
      >

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="btn-outline px-3 py-1.5 text-sm gap-1.5"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="btn-outline px-3 py-1.5 text-sm">
              + New
            </Link>
            <button
              onClick={handleShare}
              className="btn-outline px-3 py-1.5 text-sm"
            >
              Share
            </button>
            <button
              onClick={() => window.print()}
              className="btn-outline px-3 py-1.5 text-sm"
            >
              Export
            </button>
            <span
              className="text-xs font-mono ml-1"
              style={{ color: "var(--text-3)" }}
            >
              #{id}
            </span>
          </div>
        </div>

        {/* Header card */}
        <div className="card p-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold mb-0.5" style={{ color: "var(--text)" }}>
              Analysis Complete
            </h2>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>
              Sentence-level credibility breakdown
            </p>
            {/* Source domain badge */}
            {data.source_url && (() => {
              try {
                const domain = new URL(data.source_url).hostname
                return (
                  <div className="flex items-center gap-2 mt-2">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
                      alt=""
                      className="w-4 h-4 rounded-sm"
                      onError={(e) => { e.target.style.display = "none" }}
                    />
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>{domain}</span>
                  </div>
                )
              } catch { return null }
            })()}
          </div>
          <span className={badgeClass}>{label}</span>
        </div>

        {/* Score + Radar grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-6 flex flex-col items-center">
            <p className="text-xs font-medium mb-6" style={{ color: "var(--text-3)" }}>
              Overall Credibility
            </p>
            <CredibilityGauge score={overall_score} />
          </div>
          <div className="card p-6 flex flex-col">
            <p className="text-xs font-medium mb-3" style={{ color: "var(--text-3)" }}>
              Dimension Breakdown
            </p>
            <RadarChart scores={scores} />
            <div className="grid grid-cols-2 gap-2 mt-4">
              {Object.entries(scores ?? {}).map(([key, val]) => {
                const scoreColor = val < 30 ? "#10b981" : val < 55 ? "#f59e0b" : "#ef4444"
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)"
                    }}
                  >
                    <span className="text-xs font-medium capitalize" style={{ color: "var(--text-2)" }}>
                      {key}
                    </span>
                    <span className="text-xs font-bold font-mono" style={{ color: scoreColor }}>
                      {val?.toFixed(0)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tabs panel */}
        <div className="card overflow-hidden">
          <div
            className="flex"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-6 py-3.5 text-sm font-medium relative transition-all duration-200"
                style={{
                  color: tab === t ? "var(--text)" : "var(--text-3)",
                }}
              >
                {t}
                {tab === t && (
                  <motion.div
                    layoutId="tab-line"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: "#6366f1" }}
                  />
                )}
              </button>
            ))}
            {tab === "Benchmark" && (
              <button
                onClick={() => navigate("/benchmark/" + id)}
                className="ml-auto mr-4 my-2 btn-outline px-3 py-1 text-xs"
              >
                Full Report
              </button>
            )}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {tab === "Overview" && (
                <motion.div key="ov"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs font-medium mb-5" style={{ color: "var(--text-3)" }}>
                    Sentence Analysis
                  </p>
                  <SentenceHighlights sentences={sentence_results} />
                </motion.div>
              )}
              {tab === "Heatmap" && (
                <motion.div key="hm"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs font-medium mb-5" style={{ color: "var(--text-3)" }}>
                    Intensity Heatmap
                  </p>
                  <SentenceHeatmap sentences={sentence_results} />
                </motion.div>
              )}
              {tab === "Benchmark" && (
                <motion.div key="bm"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <BenchmarkPreview score={overall_score} id={id} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </motion.div>
    </div>
  )
}

function BenchmarkPreview({ score, id }) {
  const tools = [
    { name: "TruthLens",         score: score,      note: "RoBERTa — sentence-level" },
    { name: "ClaimBuster",       score: score + 8,  note: "SVM-based claim scoring"  },
    { name: "Google Fact Check", score: score - 5,  note: "Knowledge graph lookup"   },
  ]
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
          Benchmark Comparison
        </p>
        <span
          className="text-xs px-2 py-0.5 rounded-md"
          style={{
            color: "var(--text-3)",
            border: "1px solid var(--border)",
            background: "var(--surface-2)"
          }}
        >
          Live data pending
        </span>
      </div>
      {tools.map((t) => {
        const pct = Math.min(100, Math.max(0, t.score))
        const color = pct < 30 ? "#10b981" : pct < 55 ? "#f59e0b" : "#ef4444"
        return (
          <div
            key={t.name}
            className="rounded-xl p-4"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)"
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{t.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{t.note}</p>
              </div>
              <span className="text-xl font-bold font-mono" style={{ color }}>
                {pct}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: pct + "%" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: color }}
              />
            </div>
          </div>
        )
      })}
      <Link
        to={"/benchmark/" + id}
        className="btn-outline w-full py-2.5 text-sm text-center block mt-2"
      >
        View Full Benchmark Report →
      </Link>
    </div>
  )
}
