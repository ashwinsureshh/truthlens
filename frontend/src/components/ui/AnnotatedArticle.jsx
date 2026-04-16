import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const PLAIN_ENGLISH = {
  suspicious: [
    "Contains unverified or false claims",
    "Emotionally charged language detected",
    "Conspiracy-style framing detected",
    "Misleading or exaggerated statement",
    "Uses fear-based or manipulative language",
  ],
  uncertain: [
    "Hedged claim — lacks supporting evidence",
    "Unattributed assertion",
    "Speculative language detected",
    "Claim needs independent verification",
  ],
}

function getPlainReason(label, score) {
  const pool = PLAIN_ENGLISH[label] ?? []
  // deterministic pick based on score so same sentence always gets same reason
  return pool[Math.floor(score) % pool.length] ?? "Review this claim carefully"
}

export default function AnnotatedArticle({ sentences }) {
  const [expanded, setExpanded] = useState(null)

  if (!sentences?.length) return null

  const suspicious = sentences.filter(s => s.score >= 62)
  const uncertain  = sentences.filter(s => s.score >= 45 && s.score < 62)
  const credible   = sentences.filter(s => s.score < 45)

  return (
    <div className="space-y-5">

      {/* Quick summary bar */}
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
            Sentence breakdown
          </span>
          <span className="text-sm" style={{ color: "var(--text-3)" }}>
            {sentences.length} total
          </span>
        </div>

        {/* Stacked bar */}
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-3">
          {credible.length > 0 && (
            <div
              className="rounded-full transition-all"
              style={{ width: `${(credible.length / sentences.length) * 100}%`, background: "#10b981" }}
            />
          )}
          {uncertain.length > 0 && (
            <div
              className="rounded-full transition-all"
              style={{ width: `${(uncertain.length / sentences.length) * 100}%`, background: "#f59e0b" }}
            />
          )}
          {suspicious.length > 0 && (
            <div
              className="rounded-full transition-all"
              style={{ width: `${(suspicious.length / sentences.length) * 100}%`, background: "#ef4444" }}
            />
          )}
        </div>

        <div className="flex items-center gap-5">
          {[
            { label: "Credible",   count: credible.length,   color: "#10b981" },
            { label: "Uncertain",  count: uncertain.length,  color: "#f59e0b" },
            { label: "Suspicious", count: suspicious.length, color: "#ef4444" },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-sm font-semibold font-mono" style={{ color }}>{count}</span>
              <span className="text-sm" style={{ color: "var(--text-3)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Red flags section — only if any suspicious */}
      {suspicious.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{
            background: "rgba(239,68,68,0.04)",
            border: "1px solid rgba(239,68,68,0.2)"
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className="text-xs font-semibold" style={{ color: "#ef4444" }}>
              {suspicious.length} Red Flag{suspicious.length !== 1 ? "s" : ""} Detected
            </span>
          </div>
          <div className="space-y-2">
            {[...suspicious]
              .sort((a, b) => b.score - a.score)
              .map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
                >
                  <span
                    className="text-xs font-bold font-mono shrink-0 mt-0.5 px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
                  >
                    {s.score.toFixed(0)}
                  </span>
                  <div>
                    <p className="text-xs leading-relaxed mb-1" style={{ color: "var(--text-2)" }}>
                      "{s.sentence}"
                    </p>
                    <p className="text-xs" style={{ color: "#ef4444", opacity: 0.8 }}>
                      ↳ {getPlainReason("suspicious", s.score)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Annotated article */}
      <div>
        <p className="text-sm font-medium mb-3" style={{ color: "var(--text-3)" }}>
          Full article — click any highlighted sentence for details
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
              const isSupisc = pct >= 62
              const isOpen   = expanded === i

              const underlineColor = isCred
                ? "transparent"
                : isUncert
                ? "rgba(245,158,11,0.6)"
                : "rgba(239,68,68,0.7)"

              const bgColor = isCred
                ? "transparent"
                : isUncert
                ? "rgba(245,158,11,0.07)"
                : "rgba(239,68,68,0.08)"

              const textColor = isCred
                ? "var(--text-2)"
                : isUncert
                ? "#f59e0b"
                : "#ef4444"

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
                    {!isCred && (
                      <span
                        className="inline-block ml-1 text-xs font-bold font-mono"
                        style={{ color: textColor, fontSize: "10px", verticalAlign: "super", opacity: 0.85 }}
                      >
                        {pct.toFixed(0)}
                      </span>
                    )}
                  </span>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, scaleY: 0.9 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0.9 }}
                        className="block mt-1 mb-2 rounded-lg px-3 py-2 text-sm leading-relaxed"
                        style={{
                          background: isUncert ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)",
                          border: `1px solid ${isUncert ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)"}`,
                          color: "var(--text-2)",
                          transformOrigin: "top",
                        }}
                      >
                        <span className="font-medium" style={{ color: isUncert ? "#f59e0b" : "#ef4444" }}>
                          {getPlainReason(isUncert ? "uncertain" : "suspicious", pct)}
                        </span>
                        {s.explanation && s.explanation !== "No strong word-level signals detected." && (
                          <span className="block mt-1 opacity-70">{s.explanation}</span>
                        )}
                        <a
                          href={`https://www.google.com/search?q=fact+check+${encodeURIComponent(s.sentence.slice(0, 60))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-1.5 font-medium"
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
