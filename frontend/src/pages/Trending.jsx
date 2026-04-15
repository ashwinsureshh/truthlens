import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { getTrending } from "../services/api"

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
}

function StatCard({ value, label, sub, color, i }) {
  return (
    <motion.div
      custom={i}
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="card p-5 flex flex-col"
    >
      <p className="text-xs font-medium mb-2" style={{ color: "var(--text-3)" }}>{label}</p>
      <p className="text-3xl font-bold font-mono mb-1" style={{ color: color || "var(--text)" }}>
        {value}
      </p>
      {sub && <p className="text-xs" style={{ color: "var(--text-3)" }}>{sub}</p>}
    </motion.div>
  )
}

export default function Trending() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  function fetchData() {
    getTrending()
      .then((res) => {
        setData(res.data)
        setLastUpdated(new Date())
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="flex gap-1.5">
          <span className="dot-bounce w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
          <span className="dot-bounce w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
          <span className="dot-bounce w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="card p-14 text-center max-w-sm w-full">
          <p className="text-sm font-medium mb-2" style={{ color: "var(--text)" }}>Could not load data</p>
          <p className="text-xs mb-6" style={{ color: "var(--text-3)" }}>Make sure the backend is running.</p>
          <button onClick={fetchData} className="btn-outline px-5 py-2 text-sm">Retry</button>
        </div>
      </div>
    )
  }

  if (data.total === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="card p-14 text-center max-w-sm w-full">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-3)" }}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>No data yet</p>
          <p className="text-xs mb-6" style={{ color: "var(--text-3)" }}>
            Run some analyses to start seeing trending statistics.
          </p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm">
            Start Analyzing →
          </Link>
        </div>
      </div>
    )
  }

  const { total, this_week, avg_score, distribution, recent } = data
  const suspiciousPct = total > 0 ? Math.round((distribution.suspicious / total) * 100) : 0
  const crediblePct = total > 0 ? Math.round((distribution.credible / total) * 100) : 0
  const uncertainPct = total > 0 ? Math.round((distribution.uncertain / total) * 100) : 0

  const avgColor = avg_score < 45 ? "#10b981" : avg_score < 62 ? "#f59e0b" : "#ef4444"

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <motion.div custom={0} variants={fadeIn} initial="hidden" animate="visible" className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Trending</h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
                Live statistics from all TruthLens analyses
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-xs" style={{ color: "var(--text-3)" }}>
                {lastUpdated
                  ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "Live"}
                {" · auto-refreshes every 30s"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard i={1} value={total.toLocaleString()} label="Total Analyses" sub="All time" />
          <StatCard i={2} value={this_week.toLocaleString()} label="This Week" sub="Last 7 days" color="#6366f1" />
          <StatCard i={3} value={avg_score.toFixed(1)} label="Avg Score" sub="Lower = more credible" color={avgColor} />
          <StatCard i={4} value={`${suspiciousPct}%`} label="% Suspicious" sub="Score ≥ 62" color="#ef4444" />
        </div>

        {/* Distribution bar */}
        <motion.div custom={5} variants={fadeIn} initial="hidden" animate="visible" className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Score Distribution</h2>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>{total.toLocaleString()} total</span>
          </div>

          {/* Bar */}
          <div className="flex h-5 rounded-full overflow-hidden mb-4 gap-0.5">
            {crediblePct > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: crediblePct + "%" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                className="h-full rounded-l-full"
                style={{ background: "#10b981" }}
                title={`Credible: ${distribution.credible}`}
              />
            )}
            {uncertainPct > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: uncertainPct + "%" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
                className="h-full"
                style={{ background: "#f59e0b" }}
                title={`Uncertain: ${distribution.uncertain}`}
              />
            )}
            {suspiciousPct > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: suspiciousPct + "%" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                className="h-full rounded-r-full"
                style={{ background: "#ef4444" }}
                title={`Suspicious: ${distribution.suspicious}`}
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
            {[
              { label: "Credible", count: distribution.credible, pct: crediblePct, color: "#10b981" },
              { label: "Uncertain", count: distribution.uncertain, pct: uncertainPct, color: "#f59e0b" },
              { label: "Suspicious", count: distribution.suspicious, pct: suspiciousPct, color: "#ef4444" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
                <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
                  {item.label}
                </span>
                <span className="text-xs font-mono ml-auto" style={{ color: "var(--text-3)" }}>
                  {item.count.toLocaleString()} ({item.pct}%)
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent analyses */}
        <motion.div custom={6} variants={fadeIn} initial="hidden" animate="visible">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Recent Analyses</h2>
          {recent.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-sm" style={{ color: "var(--text-3)" }}>No analyses yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((a, i) => {
                const pct = a.score ?? 0
                const color = pct < 45 ? "#10b981" : pct < 62 ? "#f59e0b" : "#ef4444"
                const badge = pct < 45 ? "badge-credible" : pct < 62 ? "badge-uncertain" : "badge-suspicious"
                const verdict = pct < 45 ? "Credible" : pct < 62 ? "Uncertain" : "Suspicious"
                const date = new Date(a.created_at)
                const timeAgo = (() => {
                  const diff = Date.now() - date.getTime()
                  const mins = Math.floor(diff / 60000)
                  if (mins < 1) return "just now"
                  if (mins < 60) return `${mins}m ago`
                  const hrs = Math.floor(mins / 60)
                  if (hrs < 24) return `${hrs}h ago`
                  return date.toLocaleDateString()
                })()

                return (
                  <motion.div
                    key={a.id}
                    custom={i * 0.5 + 7}
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                  >
                    <Link
                      to={`/results/${a.id}`}
                      className="card card-hover flex items-center justify-between gap-4 p-4 block"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                        >
                          <span className="text-xs font-mono font-medium" style={{ color: "var(--text-3)" }}>
                            {a.input_type === "url" ? "URL" : "TXT"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs mb-0.5 font-mono" style={{ color: "var(--text-3)" }}>
                            #{a.id} · {timeAgo}
                          </p>
                          <p className="text-sm truncate" style={{ color: "var(--text-2)" }}>
                            {a.source_url || "Text input"}
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
