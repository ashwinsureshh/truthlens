import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const PLAIN_REASONS = {
  suspicious: [
    "May contain false or unverified claims",
    "Emotionally charged language detected",
    "Conspiracy-style framing detected",
    "Misleading or exaggerated statement",
    "Uses fear-based or manipulative language",
  ],
  uncertain: [
    "Lacks supporting evidence",
    "Unattributed assertion",
    "Speculative language detected",
    "Needs independent verification",
  ],
}

function getPlainReason(label, score) {
  const pool = PLAIN_REASONS[label] ?? []
  return pool[Math.floor(score) % pool.length] ?? "Review this claim carefully"
}

function getRiskLabel(score) {
  if (score >= 75) return { label: "High Risk", color: "#ef4444" }
  if (score >= 62) return { label: "Risky", color: "#f97316" }
  return { label: "Needs Checking", color: "#f59e0b" }
}

export default function AnnotatedArticle({ sentences }) {
  const [expanded, setExpanded] = useState(null)

  if (!sentences?.length) return null

  const suspicious = sentences.filter(s => s.score >= 62)
  const uncertain  = sentences.filter(s => s.score >= 45 && s.score < 62)
  const credible   = sentences.filter(s => s.score < 45)
  const flagged    = suspicious.length + uncertain.length

  return (
    <div className="space-y-5">

      {/* Plain-English summary */}
      <div
        className="rounded-xl p-4 flex items-start gap-4"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <div className="flex-1">
          <p className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
            {flagged === 0
              ? "This article looks clean"
              : flagged === 1
              ? "1 sentence needs your attention"
              : `${flagged} sentences need your attention`}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>
            {flagged === 0
              ? `All ${sentences.length} sentences passed our checks. Still, verify key claims with trusted sources.`
              : `Out of ${sentences.length} sentences, ${credible.length} look fine, ${uncertain.length > 0 ? `${uncertain.length} need checking` : ""}${uncertain.length > 0 && suspicious.length > 0 ? ", and " : ""}${suspicious.length > 0 ? `${suspicious.length} are risky` : ""}.`}
          </p>
        </div>
        {/* Stacked bar */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex h-2.5 w-32 rounded-full overflow-hidden gap-0.5">
            {credible.length > 0 && (
              <div style={{ width: `${(credible.length / sentences.length) * 100}%`, background: "#10b981" }} />
            )}
            {uncertain.length > 0 && (
              <div style={{ width: `${(uncertain.length / sentences.length) * 100}%`, background: "#f59e0b" }} />
            )}
            {suspicious.length > 0 && (
              <div style={{ width: `${(suspicious.length / sentences.length) * 100}%`, background: "#ef4444" }} />
            )}
          </div>
          <div className="flex items-center gap-3">
            {[
              { label: "OK",       count: credible.length,   color: "#10b981" },
              { label: "Check",    count: uncertain.length,  color: "#f59e0b" },
              { label: "Risky",    count: suspicious.length, color: "#ef4444" },
            ].filter(x => x.count > 0).map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-xs font-semibold" style={{ color }}>{count} {label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Red flags — simplified */}
      {suspicious.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className="text-sm font-semibold" style={{ color: "#ef4444" }}>
              Most suspicious sentences
            </span>
          </div>
          <div className="space-y-3">
            {[...suspicious]
              .sort((a, b) => b.score - a.score)
              .slice(0, 3)
              .map((s, i) => {
                const risk = getRiskLabel(s.score)
                return (
                  <div
                    key={i}
                    className="rounded-lg px-4 py-3"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${risk.color}20`, color: risk.color }}
                      >
                        {risk.label}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed mb-1.5" style={{ color: "var(--text-2)" }}>
                      "{s.sentence}"
                    </p>
                    <p className="text-sm font-medium" style={{ color: "#ef4444" }}>
                      ↳ {getPlainReason("suspicious", s.score)}
                    </p>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Annotated article */}
      <div>
        <p className="text-sm font-medium mb-3" style={{ color: "var(--text-3)" }}>
          Full article — tap any highlighted sentence to learn more
        </p>
        <div
          className="rounded-xl p-6"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <p className="text-base leading-9" style={{ color: "var(--text-2)" }}>
            {sentences.map((s, i) => {
              const pct      = s.score ?? 0
              const isCred   = pct < 45
              const isUncert = pct >= 45 && pct < 62
              const isOpen   = expanded === i

              const underlineColor = isCred ? "transparent"
                : isUncert ? "rgba(245,158,11,0.6)" : "rgba(239,68,68,0.7)"

              const bgColor = isCred ? "transparent"
                : isUncert ? "rgba(245,158,11,0.07)" : "rgba(239,68,68,0.08)"

              const textColor = isCred ? "var(--text-2)"
                : isUncert ? "#f59e0b" : "#ef4444"

              return (
                <span key={i} className="relative inline">
                  <span
                    onClick={() => !isCred && setExpanded(isOpen ? null : i)}
                    className={`rounded-sm transition-all duration-150 ${!isCred ? "cursor-pointer hover:brightness-110" : ""}`}
                    style={{
                      background: isOpen ? (isUncert ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)") : bgColor,
                      borderBottom: `2px solid ${underlineColor}`,
                      color: isCred ? "var(--text-2)" : textColor,
                      padding: "1px 2px",
                    }}
                  >
                    {s.sentence}
                  </span>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, scaleY: 0.9 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0.9 }}
                        className="block mt-1 mb-2 rounded-lg px-4 py-3 text-sm leading-relaxed"
                        style={{
                          background: isUncert ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)",
                          border: `1px solid ${isUncert ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)"}`,
                          color: "var(--text-2)",
                          transformOrigin: "top",
                        }}
                      >
                        <span className="font-semibold block mb-1" style={{ color: isUncert ? "#f59e0b" : "#ef4444" }}>
                          {getPlainReason(isUncert ? "uncertain" : "suspicious", pct)}
                        </span>
                        {s.explanation && s.explanation !== "No strong word-level signals detected." && (
                          <span className="block mb-1.5 opacity-70">{s.explanation}</span>
                        )}
                        <a
                          href={`https://www.google.com/search?q=fact+check+${encodeURIComponent(s.sentence.slice(0, 60))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium"
                          style={{ color: "#6366f1" }}
                          onClick={e => e.stopPropagation()}
                        >
                          Verify this claim →
                        </a>
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {" "}
                </span>
              )
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
