import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getAnalysis, getBenchmark } from "../services/api"
import { motion } from "framer-motion"

const TOOLS = [
  {
    key: "truthlens",
    name: "TruthLens",
    description: "Fine-tuned RoBERTa on LIAR dataset. Sentence-level scoring with LIME explainability.",
    strengths: ["Sentence-level granularity", "Explainable AI (LIME)", "Multi-dimensional scoring"],
  },
  {
    key: "claimbuster",
    name: "ClaimBuster",
    description: "SVM-based claim detection trained on political statements. Document-level scoring.",
    strengths: ["Fast inference", "Political claim focus", "Public API"],
  },
  {
    key: "google",
    name: "Google Fact Check",
    description: "Knowledge graph lookup against verified fact-check databases. Returns matched claims.",
    strengths: ["Broad database", "Source attribution", "Claim matching"],
  },
]

function ScoreBar({ score, delay = 0 }) {
  const pct   = Math.min(100, Math.max(0, score ?? 0))
  const color = pct < 30 ? "#10b981" : pct < 55 ? "#f59e0b" : "#ef4444"
  const label = pct < 30 ? "Credible" : pct < 55 ? "Uncertain" : "Suspicious"
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: "var(--text-3)" }}>{label}</span>
        <span className="text-2xl font-bold font-mono" style={{ color }}>{pct}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: pct + "%" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay }}
          className="h-full rounded-full"
          style={{ background: color }}
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="flex gap-1.5">
        <span className="dot-bounce w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
        <span className="dot-bounce w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
        <span className="dot-bounce w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="card p-10 text-center max-w-sm w-full">
        <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>{error}</p>
        <Link to={"/results/" + id} className="btn-outline px-5 py-2 text-sm inline-flex items-center gap-2">
          ← Back to Results
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
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-5xl mx-auto px-4 py-10 space-y-4"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            to={"/results/" + id}
            className="btn-outline px-3 py-1.5 text-sm"
          >
            ← Results
          </Link>
          <span className="text-xs font-mono" style={{ color: "var(--text-3)" }}>
            Benchmark #{id}
          </span>
        </div>

        {/* Header */}
        <div className="card p-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold mb-0.5" style={{ color: "var(--text)" }}>
              Benchmark Comparison
            </h2>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>
              TruthLens vs ClaimBuster vs Google Fact Check
            </p>
          </div>
          <span
            className="text-xs px-3 py-1 rounded-md"
            style={{
              color: "var(--text-3)",
              border: "1px solid var(--border)",
              background: "var(--surface-2)"
            }}
          >
            Stub data
          </span>
        </div>

        {/* Tool cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TOOLS.map((tool, i) => {
            const isWinner = tool.key === winner
            return (
              <motion.div
                key={tool.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="card p-5 flex flex-col gap-4"
                style={isWinner ? { borderColor: "#6366f1" } : {}}
              >
                {isWinner && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-md self-end"
                    style={{
                      color: "#6366f1",
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.3)"
                    }}
                  >
                    Most credible
                  </span>
                )}
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>{tool.name}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{tool.description}</p>
                </div>
                <ScoreBar score={scores[tool.key]} delay={0.2 + i * 0.1} />
                <div className="space-y-1.5 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-xs font-medium mb-2" style={{ color: "var(--text-3)" }}>Strengths</p>
                  {tool.strengths.map((s) => (
                    <div key={s} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-2)" }}>
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: "#6366f1" }}
                      />
                      {s}
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Score comparison */}
        <div className="card p-6">
          <p className="text-xs font-medium mb-6" style={{ color: "var(--text-3)" }}>
            Score Comparison
          </p>
          <div className="space-y-5">
            {TOOLS.map((tool) => {
              const pct   = Math.min(100, Math.max(0, scores[tool.key]))
              const color = pct < 30 ? "#10b981" : pct < 55 ? "#f59e0b" : "#ef4444"
              return (
                <div key={tool.key} className="flex items-center gap-4">
                  <span className="text-sm font-medium w-36 shrink-0" style={{ color: "var(--text-2)" }}>
                    {tool.name}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: pct + "%" }}
                      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ background: color }}
                    />
                  </div>
                  <span className="text-sm font-bold font-mono w-8 text-right" style={{ color }}>
                    {pct}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* TruthLens advantage */}
        <div className="card p-6">
          <p className="text-xs font-medium mb-5" style={{ color: "var(--text-3)" }}>
            TruthLens Advantage
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { metric: "Granularity",    value: "Sentence", sub: "vs document-level" },
              { metric: "Explainability", value: "LIME",     sub: "vs black-box"      },
              { metric: "Dimensions",     value: "4-Axis",   sub: "vs single score"   },
            ].map(({ metric, value, sub }) => (
              <div
                key={metric}
                className="text-center p-5 rounded-xl"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)"
                }}
              >
                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-3)" }}>{metric}</p>
                <p className="text-base font-bold mb-1" style={{ color: "#6366f1" }}>{value}</p>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>

      </motion.div>
    </div>
  )
}
