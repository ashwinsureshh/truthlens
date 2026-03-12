import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getAnalysis } from "../services/api"
import RadarChart from "../components/charts/RadarChart"
import CredibilityGauge from "../components/charts/CredibilityGauge"
import SentenceHighlights from "../components/ui/SentenceHighlights"

export default function Results() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    getAnalysis(id)
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load analysis."))
      .finally(() => setLoading(false))
  }, [id])

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
          <span className="text-red-400 text-xl">⚠</span>
        </div>
        <p className="text-red-400 mb-5">{error}</p>
        <Link to="/" className="btn-neon inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm">
          ← New analysis
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
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-cyan-500/[0.03] blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-12 space-y-5 animate-slide-up">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-400 transition-colors group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform inline-block">←</span>
            New analysis
          </Link>
          <span className="text-xs text-slate-700 font-mono tracking-wider">ID·{id}</span>
        </div>

        {/* Summary bar */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold gradient-text mb-0.5">Analysis Complete</h2>
            <p className="text-xs text-slate-600">Sentence-level credibility breakdown</p>
          </div>
          <span className={`text-xs uppercase tracking-widest font-semibold px-3 py-1.5 rounded-full border ${labelClasses}`}>
            {label}
          </span>
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Gauge */}
          <div className="glass-card p-6 flex flex-col items-center glow-cyan">
            <p className="text-xs text-slate-600 uppercase tracking-widest mb-6 font-medium">
              Overall Credibility
            </p>
            <CredibilityGauge score={overall_score} />
          </div>

          {/* Radar + dimension pills */}
          <div className="glass-card p-6 flex flex-col">
            <p className="text-xs text-slate-600 uppercase tracking-widest mb-3 font-medium">
              Dimension Breakdown
            </p>
            <RadarChart scores={scores} />
            <div className="grid grid-cols-2 gap-2 mt-4">
              {Object.entries(scores ?? {}).map(([key, val]) => {
                const scoreColor = val < 40
                  ? "text-emerald-400"
                  : val < 70
                  ? "text-amber-400"
                  : "text-red-400"
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2 border border-white/[0.05]"
                  >
                    <span className="text-xs text-slate-500 capitalize">{key}</span>
                    <span className={`text-xs font-bold font-mono ${scoreColor}`}>
                      {val?.toFixed(0)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sentence analysis */}
        <div className="glass-card p-6">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-5 font-medium">
            Sentence Analysis
          </p>
          <SentenceHighlights sentences={sentence_results} />
        </div>
      </div>
    </div>
  )
}
