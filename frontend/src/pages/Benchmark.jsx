import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getAnalysis, getBenchmark } from "../services/api"
import { motion } from "framer-motion"
import CredibilityGauge from "../components/charts/CredibilityGauge"

const TOOLS = [
  {
    key: "truthlens",
    name: "TruthLens",
    color: "#06b6d4",
    description: "Fine-tuned RoBERTa on LIAR dataset. Sentence-level scoring with LIME explainability.",
    strengths: ["Sentence-level granularity", "Explainable AI", "Multi-dimensional scoring"],
  },
  {
    key: "claimbuster",
    name: "ClaimBuster",
    color: "#a855f7",
    description: "SVM-based claim detection model trained on political statements. Document-level scoring.",
    strengths: ["Fast inference", "Political claim focus", "Public API"],
  },
  {
    key: "google",
    name: "Google Fact Check",
    color: "#f59e0b",
    description: "Knowledge graph lookup against verified fact-check databases. Returns matched claims.",
    strengths: ["Broad database", "Source attribution", "Claim matching"],
  },
]

function ScoreBar({ score, color, animate }) {
  const pct = Math.min(100, Math.max(0, score ?? 0))
  const label = pct < 40 ? "Credible" : pct < 70 ? "Uncertain" : "Suspicious"
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-2xl font-bold font-mono" style={{ color }}>{pct}</span>
      </div>
      <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: pct + "%" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: animate ? 0.2 : 0 }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: "0 0 12px " + color + "60" }}
        />
      </div>
    </div>
  )
}

export default function Benchmark() {
  const { id } = useParams()
  const [analysis, setAnalysis]   = useState(null)
  const [benchmark, setBenchmark] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState("")

  useEffect(() => {
    Promise.all([getAnalysis(id), getBenchmark(id).catch(() => null)])
      .then(([aRes, bRes]) => {
        setAnalysis(aRes.data)
        setBenchmark(bRes?.data ?? null)
      })
      .catch(() => setError("Could not load benchmark data."))
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
        <p className="text-slate-600 text-sm">Loading benchmark...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card p-10 text-center max-w-sm w-full">
        <p className="text-red-400 mb-5">{error}</p>
        <Link to={"/results/" + id} className="btn-neon inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm">
          Back to Results
        </Link>
      </div>
    </div>
  )

  const tl = analysis?.overall_score ?? 0
  const cb = benchmark?.claimbuster_score ?? tl + 8
  const gf = benchmark?.google_score     ?? tl - 5

  const scores = { truthlens: tl, claimbuster: cb, google: gf }
  const winner = Object.entries(scores).sort((a, b) => a[1] - b[1])[0][0]

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6 animate-slide-up">

        <div className="flex items-center justify-between">
          <Link to={"/results/" + id} className="flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-400 transition-colors group">
            <span className="group-hover:-translate-x-0.5 transition-transform inline-block">back</span>
            Back to Results
          </Link>
          <span className="text-xs text-slate-700 font-mono">benchmark / {id}</span>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold gradient-text mb-1">Benchmark Comparison</h2>
              <p className="text-sm text-slate-500">TruthLens vs ClaimBuster vs Google Fact Check</p>
            </div>
            <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-1 rounded-full">
              Stub data, Week 7 feature
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TOOLS.map((tool, i) => {
            const score = scores[tool.key]
            const isWinner = tool.key === winner
            return (
              <motion.div
                key={tool.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={"glass-card p-6 flex flex-col gap-4 " + (isWinner ? "ring-1 ring-cyan-500/30" : "")}
              >
                {isWinner && (
                  <div className="flex justify-end">
                    <span className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">Most credible</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: tool.color }} />
                    <h3 className="text-base font-semibold text-slate-200">{tool.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{tool.description}</p>
                </div>

                <ScoreBar score={score} color={tool.color} animate />

                <div className="space-y-1.5 pt-2 border-t border-white/[0.05]">
                  <p className="text-xs text-slate-600 uppercase tracking-widest mb-2">Strengths</p>
                  {tool.strengths.map((s) => (
                    <div key={s} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      {s}
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="glass-card p-6">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-6 font-medium">Score Comparison</p>
          <div className="space-y-5">
            {TOOLS.map((tool) => {
              const pct = Math.min(100, Math.max(0, scores[tool.key]))
              return (
                <div key={tool.key} className="flex items-center gap-4">
                  <span className="text-sm text-slate-400 w-36 shrink-0">{tool.name}</span>
                  <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: pct + "%" }}
                      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ background: tool.color, boxShadow: "0 0 10px " + tool.color + "60" }}
                    />
                  </div>
                  <span className="text-sm font-bold font-mono w-8 text-right" style={{ color: tool.color }}>{pct}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="glass-card p-6">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-5 font-medium">TruthLens Advantage</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { metric: "Granularity",   value: "Sentence", sub: "vs document-level" },
              { metric: "Explainability", value: "LIME",     sub: "vs black-box" },
              { metric: "Dimensions",    value: "4-axis",   sub: "vs single score" },
            ].map(({ metric, value, sub }) => (
              <div key={metric} className="text-center p-4 bg-black/20 rounded-xl border border-cyan-500/10">
                <p className="text-xs text-slate-600 uppercase tracking-widest mb-1">{metric}</p>
                <p className="text-lg font-bold gradient-text">{value}</p>
                <p className="text-xs text-slate-600 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
