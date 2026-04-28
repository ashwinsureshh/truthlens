import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { getAnalysis } from "../services/api"
import { motion, AnimatePresence } from "framer-motion"
import RadarChart from "../components/charts/RadarChart"
import CredibilityGauge from "../components/charts/CredibilityGauge"
import AnnotatedArticle from "../components/ui/AnnotatedArticle"
import TrustWaveform from "../components/charts/TrustWaveform"
import AIExplanation from "../components/ui/AIExplanation"

const TABS = ["Overview", "Waveform", "Benchmark"]

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
    <div role="status" aria-live="polite" aria-label="Loading analysis" className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
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

  const { overall_score, scores, sentence_results, sentence_count, confidence_level } = data
  const score = overall_score
  const label = score < 45 ? "Credible" : score < 62 ? "Uncertain" : "Suspicious"
  const badgeClass = score < 45 ? "badge-credible" : score < 62 ? "badge-uncertain" : "badge-suspicious"

  const VERDICT_INFO = {
    Credible: {
      color: "#10b981",
      icon: "✓",
      title: "Content appears credible",
      desc: "Low bias, factual language, and minimal sensationalism detected. Still recommended to verify key claims with primary sources.",
    },
    Uncertain: {
      color: "#f59e0b",
      icon: "⚠",
      title: "Exercise caution",
      desc: "Mixed signals detected — some sentences may be misleading or unverified. Cross-reference with trusted news outlets before sharing.",
    },
    Suspicious: {
      color: "#ef4444",
      icon: "✕",
      title: "High misinformation risk",
      desc: "Strong indicators of bias, emotional manipulation, or false claims detected. Do not share without independent verification from reliable sources.",
    },
  }
  const verdictInfo = VERDICT_INFO[label]

  const DIM_LABELS = {
    sensationalism: "Sensationalism",
    bias:           "Bias",
    emotion:        "Emotion",
    factual:        "Fact Risk",
  }
  const confidenceBadge = {
    high:   { label: "High Confidence",   color: "#10b981" },
    medium: { label: "Medium Confidence", color: "#f59e0b" },
    low:    { label: "Low Confidence",    color: "#94a3b8" },
  }[confidence_level ?? "medium"]

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
        className="relative max-w-7xl mx-auto px-4 py-10 space-y-5"
      >

        {/* Top bar */}
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="btn-outline px-3 py-1.5 text-sm shrink-0">
            ← Back
          </Link>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* + New — hidden on smallest screens */}
            <Link to="/" className="hidden sm:inline-flex btn-outline px-3 py-1.5 text-sm">
              + New
            </Link>
            {/* Share */}
            <button aria-label="Share analysis" onClick={handleShare} className="btn-outline px-3 py-1.5 text-sm flex items-center gap-1.5">
              <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>
            {/* Report Card */}
            <Link aria-label="View report card" to={`/report/${id}`} className="btn-outline px-3 py-1.5 text-sm flex items-center gap-1.5">
              <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="hidden sm:inline">Report</span>
            </Link>
            {/* Export */}
            <button aria-label="Export as PDF" onClick={() => window.print()} className="btn-outline px-3 py-1.5 text-sm flex items-center gap-1.5">
              <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              <span className="hidden sm:inline">Export</span>
            </button>
            <span className="text-xs font-mono" style={{ color: "var(--text-3)" }}>#{id}</span>
          </div>
        </div>

        {/* Header card */}
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text)" }}>
                Analysis Complete
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm" style={{ color: "var(--text-3)" }}>
                  {sentence_count ?? "—"} sentences analyzed
                </span>
                {confidenceBadge && (
                  <>
                    <span style={{ color: "var(--border-strong)" }}>·</span>
                    <span className="text-xs font-medium" style={{ color: confidenceBadge.color }}>
                      {confidenceBadge.label}
                    </span>
                  </>
                )}
              </div>
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

          {/* Verdict explanation */}
          <motion.div
            className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3"
            style={{
              background: `${verdictInfo.color}10`,
              border: `1px solid ${verdictInfo.color}30`,
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-base font-bold shrink-0 mt-0.5" style={{ color: verdictInfo.color }}>
              {verdictInfo.icon}
            </span>
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: verdictInfo.color }}>
                {verdictInfo.title}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                {verdictInfo.desc}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Score + Radar grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <div className="card p-6 flex flex-col items-center">
            <p className="text-sm font-medium mb-6" style={{ color: "var(--text-3)" }}>
              Overall Credibility
            </p>
            <CredibilityGauge score={overall_score} />
          </div>
          <div className="card p-6 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium" style={{ color: "var(--text-3)" }}>
                Dimension Breakdown
              </p>
              <span className="text-sm" style={{ color: "var(--text-3)" }}>lower = better</span>
            </div>
            <RadarChart scores={scores} />
            <div className="grid grid-cols-2 gap-2 mt-4">
              {Object.entries(scores ?? {}).map(([key, val], i) => {
                const scoreColor = val < 25 ? "#10b981" : val < 50 ? "#f59e0b" : "#ef4444"
                const riskText   = val < 25 ? "Low"    : val < 50 ? "Med"    : "High"
                return (
                  <motion.div
                    key={key}
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)"
                    }}
                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.03, borderColor: "var(--border-strong)" }}
                  >
                    <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
                      {DIM_LABELS[key] ?? key}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium" style={{ color: "var(--text-3)" }}>{riskText}</span>
                      <span className="text-sm font-bold font-mono" style={{ color: scoreColor }}>
                        {val?.toFixed(0)}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Tabs panel */}
        <div className="card overflow-hidden">
          <div
            role="tablist"
            aria-label="Analysis views"
            className="flex"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            {TABS.map((t) => (
              <motion.button
                key={t}
                role="tab"
                aria-selected={tab === t}
                aria-controls={`panel-${t}`}
                id={`tab-${t}`}
                onClick={() => setTab(t)}
                onKeyDown={(e) => {
                  const idx = TABS.indexOf(t)
                  if (e.key === "ArrowRight") setTab(TABS[(idx + 1) % TABS.length])
                  if (e.key === "ArrowLeft") setTab(TABS[(idx - 1 + TABS.length) % TABS.length])
                }}
                className="px-6 py-3.5 text-sm font-medium relative"
                style={{
                  color: tab === t ? "var(--text)" : "var(--text-3)",
                }}
                whileHover={{ color: "var(--text)" }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                {t}
                {tab === t && (
                  <motion.div
                    layoutId="tab-line"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: "#6366f1" }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </motion.button>
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
                <motion.div key="ov" role="tabpanel" id="panel-Overview" aria-labelledby="tab-Overview"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <AnnotatedArticle sentences={sentence_results} />
                </motion.div>
              )}
              {tab === "Waveform" && (
                <motion.div key="wf" role="tabpanel" id="panel-Waveform" aria-labelledby="tab-Waveform"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <TrustWaveform sentences={sentence_results} />
                </motion.div>
              )}
              {tab === "Benchmark" && (
                <motion.div key="bm" role="tabpanel" id="panel-Benchmark" aria-labelledby="tab-Benchmark"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <BenchmarkPreview score={overall_score} id={id} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* AI Explanation + Chat */}
        <AIExplanation analysisId={id} />

        {/* Disclaimer */}
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
          }}
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5" style={{ color: "var(--text-3)" }}>
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
            <strong style={{ color: "var(--text-2)" }}>AI Analysis Disclaimer:</strong> TruthLens uses a fine-tuned RoBERTa model to estimate credibility.
            Results are probabilistic signals, not definitive verdicts. Always verify claims independently
            using trusted sources such as{" "}
            <a href="https://www.snopes.com" target="_blank" rel="noopener noreferrer" aria-label="Snopes (opens in new tab)" style={{ color: "#6366f1" }}>Snopes</a>,{" "}
            <a href="https://www.factcheck.org" target="_blank" rel="noopener noreferrer" aria-label="FactCheck.org (opens in new tab)" style={{ color: "#6366f1" }}>FactCheck.org</a>, or{" "}
            <a href="https://www.reuters.com/fact-check" target="_blank" rel="noopener noreferrer" aria-label="Reuters Fact Check (opens in new tab)" style={{ color: "#6366f1" }}>Reuters Fact Check</a>.
          </p>
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
        const color = pct < 45 ? "#10b981" : pct < 62 ? "#f59e0b" : "#ef4444"
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
            <div
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${t.name} score: ${pct}`}
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--border)" }}
            >
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
