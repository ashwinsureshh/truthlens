import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getHistory } from "../services/api"

export default function History() {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHistory()
      .then((res) => setAnalyses(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex gap-1.5">
        <span className="dot-bounce w-2 h-2 rounded-full bg-cyan-400" />
        <span className="dot-bounce w-2 h-2 rounded-full bg-cyan-400" />
        <span className="dot-bounce w-2 h-2 rounded-full bg-cyan-400" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12 animate-slide-up">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold gradient-text mb-1">Analysis History</h2>
          <p className="text-slate-600 text-sm">
            {analyses.length} past {analyses.length === 1 ? "analysis" : "analyses"}
          </p>
        </div>

        {analyses.length === 0 ? (
          <div className="glass-card p-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/[0.08] border border-cyan-500/15 flex items-center justify-center mx-auto mb-4">
              <span className="text-cyan-500 text-xl">○</span>
            </div>
            <p className="text-slate-500 mb-6 text-sm">No analyses yet.</p>
            <Link to="/" className="btn-neon inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm">
              Start Analyzing →
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {analyses.map((a) => {
              const scoreColor = a.overall_score < 40
                ? "text-emerald-400"
                : a.overall_score < 70
                ? "text-amber-400"
                : "text-red-400"
              const scoreBg = a.overall_score < 40
                ? "bg-emerald-500/10 border-emerald-500/20"
                : a.overall_score < 70
                ? "bg-amber-500/10 border-amber-500/20"
                : "bg-red-500/10 border-red-500/20"
              const verdict = a.overall_score < 40 ? "Credible" : a.overall_score < 70 ? "Uncertain" : "Suspicious"

              return (
                <Link
                  key={a.id}
                  to={`/results/${a.id}`}
                  className="glass-card block p-4 hover:border-cyan-500/25 transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-center shrink-0">
                        <span className="text-slate-500 text-sm">
                          {a.input_type === "url" ? "⊕" : "❏"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-0.5">
                          {a.input_type}
                        </p>
                        <p className="text-sm text-slate-300 truncate">
                          {a.source_url || "Text input"}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${scoreBg} ${scoreColor}`}>
                        <span className="font-mono font-bold">{a.overall_score}</span>
                        <span className="opacity-60">{verdict}</span>
                      </span>
                      <p className="text-[10px] text-slate-700 font-mono">
                        {new Date(a.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
