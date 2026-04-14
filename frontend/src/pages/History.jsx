import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { getHistory } from "../services/api"

export default function History() {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState("")
  const [filter, setFilter]     = useState("all") // "all" | "credible" | "uncertain" | "suspicious"
  const isGuest = !localStorage.getItem("token")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      getHistory()
        .then((res) => setAnalyses(res.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      // Load from localStorage for guests
      const guestHistory = JSON.parse(localStorage.getItem("guest_history") || "[]")
      setAnalyses(guestHistory)
      setLoading(false)
    }
  }, [])

  const filtered = analyses.filter((a) => {
    const pct = a.overall_score ?? 0
    const verdict = pct < 45 ? "credible" : pct < 62 ? "uncertain" : "suspicious"
    const matchesFilter = filter === "all" || verdict === filter
    const searchText = (a.source_url || "Text input").toLowerCase()
    const matchesSearch = !search || searchText.includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="flex gap-1.5">
        <span className="dot-bounce w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
        <span className="dot-bounce w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
        <span className="dot-bounce w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Guest banner */}
          {isGuest && (
            <div
              className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 mb-6"
              style={{
                background: "rgba(99,102,241,0.07)",
                border: "1px solid rgba(99,102,241,0.18)",
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <p className="text-xs" style={{ color: "var(--text-2)" }}>
                  You're viewing local history.{" "}
                  <span style={{ color: "#818cf8" }}>Sign in to save your history permanently.</span>
                </p>
              </div>
              <Link
                to="/login"
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "#6366f1", color: "white" }}
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Header */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                Analysis History
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
                Your past credibility analyses
              </p>
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--text-3)" }}>
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Search + Filter bar */}
          {analyses.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Search input */}
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--text-3)" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search analyses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field w-full pl-9 pr-4 py-2 text-sm rounded-xl"
                />
              </div>
              {/* Filter buttons */}
              <div className="flex gap-1.5">
                {["all", "credible", "uncertain", "suspicious"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all"
                    style={filter === f ? {
                      background: f === "all" ? "#6366f1" : f === "credible" ? "#10b981" : f === "uncertain" ? "#f59e0b" : "#ef4444",
                      color: "white"
                    } : {
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-2)"
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {analyses.length === 0 ? (
            <div className="card p-14 text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-3)" }}>
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>No records yet</p>
              <p className="text-xs mb-6" style={{ color: "var(--text-3)" }}>
                Run your first analysis to see results here.
              </p>
              <Link
                to="/"
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm"
              >
                Start Analyzing →
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-14 text-center">
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>No matching results</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                Try adjusting your search or filter.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((a, i) => {
                const pct     = a.overall_score ?? 0
                const color   = pct < 45 ? "#10b981" : pct < 62 ? "#f59e0b" : "#ef4444"
                const badge   = pct < 45 ? "badge-credible" : pct < 62 ? "badge-uncertain" : "badge-suspicious"
                const verdict = pct < 45 ? "Credible" : pct < 62 ? "Uncertain" : "Suspicious"

                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                  >
                    <Link
                      to={`/results/${a.id}`}
                      className="card card-hover flex items-center justify-between gap-4 p-4 block"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Type badge */}
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: "var(--surface-2)",
                            border: "1px solid var(--border)"
                          }}
                        >
                          <span className="text-xs font-mono font-medium" style={{ color: "var(--text-3)" }}>
                            {a.input_type === "url" ? "URL" : "TXT"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs mb-0.5 font-mono" style={{ color: "var(--text-3)" }}>
                            #{a.id} · {new Date(a.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm truncate" style={{ color: "var(--text-2)" }}>
                            {a.source_url || a.text_preview || "Text input"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        <span className={badge}>{verdict}</span>
                        <span className="text-lg font-bold font-mono" style={{ color }}>
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
