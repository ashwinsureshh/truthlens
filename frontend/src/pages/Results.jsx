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

  function handleExport() { window.print() }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="flex gap-1.5">
          <span className="dot-bounce w-2 h-2 rounded-full bg-cyan-400" />
          <span className="dot-bounce w-2 h-2 rounded-full bg-cyan-400" />
          <span className="dot-bounce w-2 h-2 rounded-full bg-cyan-400" />
        </div>
        <p className="text-slate-600 text-sm tracking-wide">Loading analysis...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card p-10 text-center max-w-sm w-full">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-red-400 text-xl">warning</span>
        </div>
        <p className="text-red-400 mb-5">{error}</p>
        <Link to="/" className="btn-neon inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm">
          back New analysis
        </Link>
      </div>
    </div>
  )

  const { overall_score, scores, sentence_results } = data
  const label = overall_score < 40 ? "Credible" : overall_score < 70 ? "Uncertain" : "Suspicious"
  const labelClasses = overall_score < 40
    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : overall_score < 70
    ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-red-400 bg-red-500/10 border-red-500/20"

  return (
    <div className="min-h-screen">
      <div className="relative max-w-5xl mx-auto px-4 py-12 space-y-5 animate-slide-up">

        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-400 transition-colors group">
            <span className="group-hover:-translate-x-0.5 transition-transform inline-block">back</span>
            New analysis
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-200 bg-white/[0.04] border border-white/[0.07] hover:border-white/[0.14] transition-all">
              {copied ? "Copied!" : "Share"}
            </button>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-200 bg-white/[0.04] border border-white/[0.07] hover:border-white/[0.14] transition-all">
              Export
            </button>
            <span className="text-xs text-slate-700 font-mono tracking-wider ml-1">ID {id}</span>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold gradient-text mb-0.5">Analysis Complete</h2>
            <p className="text-xs text-slate-600">Sentence-level credibility breakdown</p>
          </div>
          <span className={"text-xs uppercase tracking-widest font-semibold px-3 py-1.5 rounded-full border " + labelClasses}>
            {label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="glass-card p-6 flex flex-col items-center glow-cyan">
            <p className="text-xs text-slate-600 uppercase tracking-widest mb-6 font-medium">Overall Credibility</p>
            <CredibilityGauge score={overall_score} />
          </div>
          <div className="glass-card p-6 flex flex-col">
            <p className="text-xs text-slate-600 uppercase tracking-widest mb-3 font-medium">Dimension Breakdown</p>
            <RadarChart scores={scores} />
            <div className="grid grid-cols-2 gap-2 mt-4">
              {Object.entries(scores ?? {}).map(([key, val]) => {
                const c = val < 40 ? "text-emerald-400" : val < 70 ? "text-amber-400" : "text-red-400"
                return (
                  <div key={key} className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2 border border-white/[0.05]">
                    <span className="text-xs text-slate-500 capitalize">{key}</span>
                    <span className={"text-xs font-bold font-mono " + c}>{val?.toFixed(0)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="flex border-b border-white/[0.06]">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={"px-6 py-3.5 text-sm font-medium transition-all duration-200 relative " + (tab === t ? "text-cyan-400" : "text-slate-500 hover:text-slate-300")}
              >
                {t}
                {tab === t && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-cyan-500 to-purple-500" />
                )}
              </button>
            ))}
            {tab === "Benchmark" && (
              <button onClick={() => navigate("/benchmark/" + id)} className="ml-auto mr-4 my-2 px-3 py-1 rounded-lg text-xs text-slate-500 hover:text-cyan-400 border border-white/[0.07] hover:border-cyan-500/20 transition-all">
                Full report
              </button>
            )}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {tab === "Overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                  <p className="text-xs text-slate-600 uppercase tracking-widest mb-5 font-medium">Sentence Analysis</p>
                  <SentenceHighlights sentences={sentence_results} />
                </motion.div>
              )}
              {tab === "Heatmap" && (
                <motion.div key="heatmap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                  <p className="text-xs text-slate-600 uppercase tracking-widest mb-5 font-medium">Intensity Heatmap</p>
                  <SentenceHeatmap sentences={sentence_results} />
                </motion.div>
              )}
              {tab === "Benchmark" && (
                <motion.div key="benchmark" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                  <BenchmarkPreview score={overall_score} id={id} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  )
}

function BenchmarkPreview({ score, id }) {
  const tools = [
    { name: "TruthLens",         score: score,      color: "#06b6d4", note: "RoBERTa, sentence-level" },
    { name: "ClaimBuster",       score: score + 8,  color: "#a855f7", note: "SVM-based claim scoring"  },
    { name: "Google Fact Check", score: score - 5,  color: "#f59e0b", note: "Knowledge graph lookup"   },
  ]
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-slate-600 uppercase tracking-widest font-medium">Benchmark Comparison</p>
        <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">Stub, Live in Week 7</span>
      </div>
      {tools.map((t) => {
        const pct = Math.min(100, Math.max(0, t.score))
        const lbl = pct < 40 ? "Credible" : pct < 70 ? "Uncertain" : "Suspicious"
        return (
          <div key={t.name} className="bg-black/20 rounded-xl p-4 border border-white/[0.05]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-200">{t.name}</p>
                <p className="text-xs text-slate-600 mt-0.5">{t.note}</p>
              </div>
              <span className="text-xl font-bold font-mono" style={{ color: t.color }}>{pct}</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: pct + "%" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: t.color, boxShadow: "0 0 10px " + t.color + "80" }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: t.color }}>{lbl}</p>
          </div>
        )
      })}
      <Link to={"/benchmark/" + id} className="btn-neon w-full py-2.5 rounded-xl text-sm text-center block mt-2">
        View Full Benchmark Report
      </Link>
    </div>
  )
}
