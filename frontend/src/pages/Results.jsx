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
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="flex gap-1.5">
          <span className="dot-bounce w-1.5 h-1.5 rounded-sm bg-white" />
          <span className="dot-bounce w-1.5 h-1.5 rounded-sm bg-white" />
          <span className="dot-bounce w-1.5 h-1.5 rounded-sm bg-white" />
        </div>
        <p className="font-terminal text-[10px] text-white/20 tracking-[0.3em] uppercase">
          Loading analysis...
        </p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="spotlight-card p-10 text-center max-w-sm w-full">
        <p className="font-terminal text-white/40 text-xs mb-6">! ERR :: {error}</p>
        <Link to="/" className="btn-outline px-5 py-2 rounded-sm text-[10px] font-terminal tracking-[0.2em] uppercase inline-flex items-center gap-2">
          ← NEW ANALYSIS
        </Link>
      </div>
    </div>
  )

  const { overall_score, scores, sentence_results } = data
  const label   = overall_score < 30 ? "CREDIBLE" : overall_score < 55 ? "UNCERTAIN" : "SUSPICIOUS"

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-5xl mx-auto px-4 py-10 space-y-4"
      >

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 font-terminal text-[10px] text-white/25 hover:text-white/60 transition-colors tracking-widest uppercase">
            ← BACK
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="btn-outline px-3 py-1.5 rounded-sm text-[10px] font-terminal tracking-widest uppercase">
              + NEW
            </Link>
            <button onClick={handleShare}
              className="btn-outline px-3 py-1.5 rounded-sm text-[10px] font-terminal tracking-widest uppercase"
            >
              {copied ? "COPIED!" : "SHARE"}
            </button>
            <button onClick={() => window.print()}
              className="btn-outline px-3 py-1.5 rounded-sm text-[10px] font-terminal tracking-widest uppercase"
            >
              EXPORT
            </button>
            <span className="font-terminal text-[9px] text-white/15 tracking-widest ml-1">#{id}</span>
          </div>
        </div>

        {/* Header card */}
        <div className="spotlight-card p-5 flex items-center justify-between border-beam">
          <div>
            <h2 className="font-terminal text-sm font-bold text-white tracking-widest mb-0.5">
              ANALYSIS COMPLETE
            </h2>
            <p className="font-terminal text-[9px] text-white/20 tracking-[0.2em] uppercase">
              Sentence-level credibility breakdown
            </p>
          </div>
          <span className="font-terminal text-[10px] tracking-[0.25em] uppercase px-4 py-1.5 border border-white/15 rounded-sm text-white/50">
            {label}
          </span>
        </div>

        {/* Score + Radar grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="spotlight-card p-6 flex flex-col items-center">
            <p className="font-terminal text-[9px] text-white/20 tracking-[0.2em] uppercase mb-6">
              // OVERALL CREDIBILITY
            </p>
            <CredibilityGauge score={overall_score} />
          </div>
          <div className="spotlight-card p-6 flex flex-col">
            <p className="font-terminal text-[9px] text-white/20 tracking-[0.2em] uppercase mb-3">
              // DIMENSION BREAKDOWN
            </p>
            <RadarChart scores={scores} />
            <div className="grid grid-cols-2 gap-2 mt-4">
              {Object.entries(scores ?? {}).map(([key, val]) => {
                const op = val < 40 ? "text-white" : val < 70 ? "text-white/50" : "text-white/25"
                return (
                  <div key={key}
                    className="flex items-center justify-between bg-white/[0.02] rounded-sm px-3 py-2 border border-white/[0.05]"
                  >
                    <span className="font-terminal text-[9px] text-white/25 uppercase tracking-widest capitalize">{key}</span>
                    <span className={`font-terminal text-xs font-bold ${op}`}>{val?.toFixed(0)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tabs panel */}
        <div className="spotlight-card overflow-hidden">
          <div className="flex border-b border-white/[0.06]">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-6 py-3.5 font-terminal text-[10px] tracking-[0.2em] uppercase transition-all duration-200 relative ${
                  tab === t ? "text-white" : "text-white/20 hover:text-white/50"
                }`}
              >
                {t}
                {tab === t && (
                  <motion.div layoutId="tab-line"
                    className="absolute bottom-0 left-0 right-0 h-px bg-white/50"
                  />
                )}
              </button>
            ))}
            {tab === "Benchmark" && (
              <button onClick={() => navigate("/benchmark/" + id)}
                className="ml-auto mr-4 my-2 btn-outline px-3 py-1 rounded-sm font-terminal text-[9px] tracking-widest uppercase"
              >
                FULL REPORT
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
                  <p className="font-terminal text-[9px] text-white/15 tracking-[0.2em] uppercase mb-5">
                    // SENTENCE ANALYSIS
                  </p>
                  <SentenceHighlights sentences={sentence_results} />
                </motion.div>
              )}
              {tab === "Heatmap" && (
                <motion.div key="hm"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="font-terminal text-[9px] text-white/15 tracking-[0.2em] uppercase mb-5">
                    // INTENSITY HEATMAP
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
    { name: "TRUTHLENS",         score: score,      note: "RoBERTa // sentence-level" },
    { name: "CLAIMBUSTER",       score: score + 8,  note: "SVM-based claim scoring"   },
    { name: "GOOGLE FACT CHECK", score: score - 5,  note: "Knowledge graph lookup"    },
  ]
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-5">
        <p className="font-terminal text-[9px] text-white/15 tracking-[0.2em] uppercase">
          // BENCHMARK COMPARISON
        </p>
        <span className="font-terminal text-[9px] text-white/20 border border-white/10 px-2 py-0.5 rounded-sm tracking-widest">
          LIVE DATA PENDING
        </span>
      </div>
      {tools.map((t) => {
        const pct = Math.min(100, Math.max(0, t.score))
        const op  = pct < 40 ? 1 : pct < 70 ? 0.5 : 0.25
        return (
          <div key={t.name} className="bg-white/[0.02] rounded-sm p-4 border border-white/[0.05]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-terminal text-xs font-bold text-white tracking-widest">{t.name}</p>
                <p className="font-terminal text-[9px] text-white/20 mt-0.5 tracking-widest">{t.note}</p>
              </div>
              <span className="font-terminal text-xl font-bold" style={{ color: `rgba(255,255,255,${op})` }}>
                {pct}
              </span>
            </div>
            <div className="h-px bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: pct + "%" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: `rgba(255,255,255,${op})` }}
              />
            </div>
          </div>
        )
      })}
      <Link to={"/benchmark/" + id}
        className="btn-outline w-full py-2.5 rounded-sm font-terminal text-[10px] tracking-[0.2em] uppercase text-center block mt-2"
      >
        VIEW FULL BENCHMARK REPORT →
      </Link>
    </div>
  )
}
