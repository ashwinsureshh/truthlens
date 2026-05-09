import { motion } from "framer-motion"

/**
 * LinkedSourcesCard
 * -----------------
 * Lists every hyperlink found in the article body together with the
 * domain's credibility tier. Renders nothing if no links were found.
 *
 * Props:
 *   linkedSources: [
 *     { url, domain, name, known, trust, verdict, modifier, bias, factual }
 *   ]
 *   summary: { total, counts, modifier }
 */

const VERDICT_STYLE = {
  credible:    { color: "#10b981", label: "Credible source"   },
  mixed:       { color: "#f59e0b", label: "Mixed source"      },
  suspicious:  { color: "#ef4444", label: "Suspicious source" },
  satire:      { color: "#8b5cf6", label: "Satire"            },
  unknown:     { color: "#94a3b8", label: "Unknown source"    },
}


export default function LinkedSourcesCard({ linkedSources, summary }) {
  if (!linkedSources || linkedSources.length === 0) return null

  const total   = summary?.total ?? linkedSources.length
  const mod     = summary?.modifier ?? 0
  const counts  = summary?.counts || {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                boxShadow: "0 4px 14px rgba(99,102,241,0.25)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="white" strokeWidth="2.4" strokeLinecap="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Cited Hyperlinks
              </h3>
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                {total} link{total !== 1 ? "s" : ""} found · score adjusted by{" "}
                <span style={{ color: mod < 0 ? "#10b981" : mod > 0 ? "#ef4444" : "var(--text-3)" }}>
                  {mod > 0 ? "+" : ""}{mod}
                </span>
              </p>
            </div>
          </div>

          {/* Quick verdict counts */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["credible", "mixed", "suspicious", "satire", "unknown"]).map((v) => {
              const n = counts[v] || 0
              if (!n) return null
              const s = VERDICT_STYLE[v]
              return (
                <span
                  key={v}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{
                    background: `${s.color}1a`,
                    color: s.color,
                    border: `1px solid ${s.color}55`,
                  }}
                >
                  {n} {v}
                </span>
              )
            })}
          </div>
        </div>

        {/* Link list */}
        <div className="space-y-2">
          {linkedSources.map((link, i) => {
            const v = VERDICT_STYLE[link.verdict] || VERDICT_STYLE.unknown
            return (
              <motion.div
                key={`${link.url}-${i}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{
                  background: "var(--surface-2)",
                  border: `1px solid ${v.color}33`,
                  boxShadow: `inset 3px 0 0 ${v.color}`,
                }}
              >
                {/* Verdict dot */}
                <span
                  className="shrink-0 w-2 h-2 rounded-full"
                  style={{ background: v.color }}
                  title={v.label}
                />

                {/* Source info */}
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold truncate" style={{ color: "var(--text)" }}>
                    {link.name || link.domain}
                    {link.bias && (
                      <span
                        className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{
                          color: "var(--text-3)",
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {link.bias}
                      </span>
                    )}
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[10.5px] truncate hover:underline"
                    style={{ color: "var(--text-3)" }}
                    title={link.url}
                  >
                    {link.url}
                  </a>
                </div>

                {/* Verdict pill */}
                <span
                  className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: `${v.color}1a`,
                    color: v.color,
                    border: `1px solid ${v.color}55`,
                  }}
                >
                  {v.label}
                </span>

                {/* Score modifier */}
                {link.modifier !== 0 && (
                  <span
                    className="shrink-0 text-[10px] font-bold tabular-nums w-8 text-right"
                    style={{ color: link.modifier < 0 ? "#10b981" : "#ef4444" }}
                  >
                    {link.modifier > 0 ? "+" : ""}{Math.round(link.modifier)}
                  </span>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Footer */}
        <p className="mt-3 text-[10px]" style={{ color: "var(--text-3)" }}>
          Source ratings sourced from Media Bias/Fact Check ·
          modifier is damped to ≤ ±10 so cited links cannot alone flip the verdict.
        </p>
      </div>
    </motion.div>
  )
}
