import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { getHistory } from "../services/api"

export default function History() {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getHistory()
      .then((res) => setAnalyses(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex gap-1.5">
        <span className="dot-bounce w-1.5 h-1.5 rounded-sm bg-white" />
        <span className="dot-bounce w-1.5 h-1.5 rounded-sm bg-white" />
        <span className="dot-bounce w-1.5 h-1.5 rounded-sm bg-white" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="font-terminal text-[9px] text-white/15 tracking-[0.3em] uppercase mb-2">
                // ANALYSIS LOG
              </p>
              <h2 className="font-terminal text-xl font-bold text-white tracking-widest">HISTORY</h2>
            </div>
            <span className="font-terminal text-[9px] text-white/20 tracking-widest">
              {analyses.length} RECORD{analyses.length !== 1 ? "S" : ""}
            </span>
          </div>

          {analyses.length === 0 ? (
            <div className="spotlight-card p-14 text-center">
              <p className="font-terminal text-[10px] text-white/15 tracking-[0.2em] uppercase mb-6">
                NO RECORDS FOUND
              </p>
              <Link to="/"
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-sm font-terminal text-[10px] tracking-[0.2em] uppercase"
              >
                START ANALYZING →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {analyses.map((a, i) => {
                const pct     = a.overall_score ?? 0
                const isGood  = pct < 40
                const isMid   = pct >= 40 && pct < 70
                const op      = isGood ? "text-white" : isMid ? "text-white/50" : "text-white/25"
                const verdict = isGood ? "CREDIBLE" : isMid ? "UNCERTAIN" : "SUSPICIOUS"

                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                  >
                    <Link
                      to={`/results/${a.id}`}
                      className="spotlight-card flex items-center justify-between gap-4 p-4 block transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Icon */}
                        <div className="w-8 h-8 border border-white/10 rounded-sm flex items-center justify-center shrink-0">
                          <span className="font-terminal text-[9px] text-white/30">
                            {a.input_type === "url" ? "URL" : "TXT"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-terminal text-[9px] text-white/15 tracking-widest uppercase mb-0.5">
                            #{a.id} // {new Date(a.created_at).toLocaleDateString()}
                          </p>
                          <p className="font-terminal text-[11px] text-white/50 truncate">
                            {a.source_url || "Text input"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        <span className={`font-terminal text-xs tracking-[0.25em] uppercase px-3 py-1 border border-white/10 rounded-sm ${op}`}>
                          {verdict}
                        </span>
                        <span className={`font-terminal text-lg font-bold ${op}`}>
                          {pct}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
