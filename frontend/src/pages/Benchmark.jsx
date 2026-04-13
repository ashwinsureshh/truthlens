import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getAnalysis, getBenchmark } from "../services/api"
import { motion } from "framer-motion"

const TOOLS = [
  {
    key: "truthlens",
    name: "TRUTHLENS",
    description: "Fine-tuned RoBERTa on LIAR dataset. Sentence-level scoring with LIME explainability.",
    strengths: ["Sentence-level granularity", "Explainable AI (LIME)", "Multi-dimensional scoring"],
  },
  {
    key: "claimbuster",
    name: "CLAIMBUSTER",
    description: "SVM-based claim detection trained on political statements. Document-level scoring.",
    strengths: ["Fast inference", "Political claim focus", "Public API"],
  },
  {
    key: "google",
    name: "GOOGLE FACT CHECK",
    description: "Knowledge graph lookup against verified fact-check databases. Returns matched claims.",
    strengths: ["Broad database", "Source attribution", "Claim matching"],
  },
]

function ScoreBar({ score, delay = 0 }) {
  const pct = Math.min(100, Math.max(0, score ?? 0))
  const op  = pct < 40 ? 1 : pct < 70 ? 0.5 : 0.25
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-terminal text-[9px] text-white/20 tracking-widest uppercase">
          {pct < 40 ? "CREDIBLE" : pct < 70 ? "UNCERTAIN" : "SUSPICIOUS"}
        </span>
        <span className="font-terminal text-2xl font-bold" style={{ color: `rgba(255,255,255,${op})` }}>{pct}</span>
      </div>
      <div className="h-px bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: pct + "%" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay }}
          className="h-full rounded-full"
          style={{ background: `rgba(255,255,255,${op})` }}
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
      <div className="flex gap-1.5">
        <span className="dot-bounce w-1.5 h-1.5 rounded-sm bg-white" />
        <span className="dot-bounce w-1.5 h-1.5 rounded-sm bg-white" />
        <span className="dot-bounce w-1.5 h-1.5 rounded-sm bg-white" />
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="spotlight-card p-10 text-center max-w-sm w-full">
        <p className="font-terminal text-xs text-white/40 mb-6">! ERR :: {error}</p>
        <Link to={"/results/" + id} className="btn-outline px-5 py-2 rounded-sm font-terminal text-[10px] tracking-[0.2em] uppercase inline-flex items-center gap-2">
          ← BACK TO RESULTS
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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-5xl mx-auto px-4 py-10 space-y-4"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link to={"/results/" + id}
            className="font-terminal text-[10px] text-white/25 hover:text-white/60 transition-colors tracking-widest uppercase"
          >
            ← RESULTS
          </Link>
          <span className="font-terminal text-[9px] text-white/15 tracking-widest">BENCHMARK // #{id}</span>
        </div>

        {/* Header */}
        <div className="spotlight-card p-5 flex items-center justify-between border-beam">
          <div>
            <h2 className="font-terminal text-sm font-bold text-white tracking-widest mb-0.5">
              BENCHMARK COMPARISON
            </h2>
            <p className="font-terminal text-[9px] text-white/20 tracking-[0.2em] uppercase">
              TruthLens vs ClaimBuster vs Google Fact Check
            </p>
          </div>
          <span className="font-terminal text-[9px] text-white/20 border border-white/10 px-3 py-1 rounded-sm tracking-widest">
            STUB DATA
          </span>
        </div>

        {/* Tool cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TOOLS.map((tool, i) => {
            const isWinner = tool.key === winner
            return (
              <motion.div key={tool.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`spotlight-card p-5 flex flex-col gap-4 ${isWinner ? "border-white/20" : ""}`}
              >
                {isWinner && (
                  <span className="font-terminal text-[9px] text-white/50 border border-white/15 px-2 py-0.5 rounded-sm tracking-widest self-end">
                    MOST CREDIBLE
                  </span>
                )}
                <div>
                  <h3 className="font-terminal text-xs font-bold text-white tracking-widest mb-2">{tool.name}</h3>
                  <p className="font-terminal text-[10px] text-white/25 leading-relaxed">{tool.description}</p>
                </div>
                <ScoreBar score={scores[tool.key]} delay={0.2 + i * 0.1} />
                <div className="space-y-1.5 pt-3 border-t border-white/[0.05]">
                  <p className="font-terminal text-[9px] text-white/15 tracking-widest uppercase mb-2">STRENGTHS</p>
                  {tool.strengths.map((s) => (
                    <div key={s} className="flex items-center gap-2 font-terminal text-[10px] text-white/30">
                      <span className="w-1 h-1 bg-white/20 rounded-sm shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Score comparison bar chart */}
        <div className="spotlight-card p-6">
          <p className="font-terminal text-[9px] text-white/15 tracking-[0.2em] uppercase mb-6">
            // SCORE COMPARISON
          </p>
          <div className="space-y-5">
            {TOOLS.map((tool) => {
              const pct = Math.min(100, Math.max(0, scores[tool.key]))
              const op  = pct < 40 ? 1 : pct < 70 ? 0.5 : 0.25
              return (
                <div key={tool.key} className="flex items-center gap-4">
                  <span className="font-terminal text-[10px] text-white/30 w-36 shrink-0 tracking-widest">{tool.name}</span>
                  <div className="flex-1 h-px bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: pct + "%" }}
                      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full"
                      style={{ background: `rgba(255,255,255,${op})` }}
                    />
                  </div>
                  <span className="font-terminal text-sm font-bold w-8 text-right"
                    style={{ color: `rgba(255,255,255,${op})` }}
                  >{pct}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* TruthLens advantage */}
        <div className="spotlight-card p-6">
          <p className="font-terminal text-[9px] text-white/15 tracking-[0.2em] uppercase mb-5">
            // TRUTHLENS ADVANTAGE
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { metric: "GRANULARITY",    value: "SENTENCE", sub: "vs document-level" },
              { metric: "EXPLAINABILITY", value: "LIME",     sub: "vs black-box"       },
              { metric: "DIMENSIONS",     value: "4-AXIS",   sub: "vs single score"    },
            ].map(({ metric, value, sub }) => (
              <div key={metric}
                className="text-center p-5 bg-white/[0.02] border border-white/[0.06] rounded-sm"
              >
                <p className="font-terminal text-[9px] text-white/20 tracking-widest uppercase mb-2">{metric}</p>
                <p className="font-terminal text-base font-bold text-white mb-1">{value}</p>
                <p className="font-terminal text-[9px] text-white/20 tracking-widest">{sub}</p>
              </div>
            ))}
          </div>
        </div>

      </motion.div>
    </div>
  )
}
