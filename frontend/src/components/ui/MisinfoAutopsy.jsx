import { motion } from "framer-motion"

/**
 * MisinfoAutopsy
 * --------------
 * Renders the analysis as a styled forensic report — each row is a
 * clinical section (PATIENT · SYMPTOMS · DIAGNOSIS · TREATMENT ·
 * PROGNOSIS). Inspired by incident-report UI patterns from 21st.dev.
 *
 * This is purely a display component — all data comes from Results.jsx.
 */

const PROGNOSIS_TEXT = {
  Credible:   "Low risk of misinformation. Article may be shared, but verify statistics and quotes against primary sources first.",
  Uncertain:  "Moderate risk detected. Cross-reference key claims with Reuters, AP News, or FactCheck.org before sharing.",
  Suspicious: "HIGH RISK — do not share without independent verification. Article shows strong indicators of manipulation or false claims.",
}

const VERDICT_META = {
  Credible:   { color: "#10b981", stamp: "CLEARED",  bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)" },
  Uncertain:  { color: "#f59e0b", stamp: "REVIEW",   bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)" },
  Suspicious: { color: "#ef4444", stamp: "FLAGGED",  bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)"  },
}

function Row({ label, value, sub, color, delay = 0 }) {
  return (
    <motion.div
      className="flex items-start gap-0"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Label column */}
      <div
        className="w-28 shrink-0 px-5 py-4 self-stretch flex items-start"
        style={{ borderRight: "1px solid var(--border)" }}
      >
        <span
          className="text-[9px] font-black uppercase tracking-[0.2em] font-mono pt-0.5"
          style={{ color }}
        >
          {label}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4 min-w-0">
        <p className="text-sm font-medium leading-snug" style={{ color: "var(--text)" }}>
          {value}
        </p>
        {sub && (
          <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "var(--text-3)" }}>
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default function MisinfoAutopsy({
  score,
  scores,
  sentenceCount,
  linkedSources,
  articleText,
}) {
  const verdict     = score < 45 ? "Credible" : score < 62 ? "Uncertain" : "Suspicious"
  const meta        = VERDICT_META[verdict]
  const wordCount   = articleText
    ? articleText.replace(/\n\nCited links:[\s\S]*/i, "").trim().split(/\s+/).length
    : 0
  const linksFound  = linkedSources?.length ?? 0
  const sens        = Math.round(scores?.sensationalism ?? 0)
  const bias        = Math.round(scores?.bias ?? 0)
  const emot        = Math.round(scores?.emotion ?? 0)
  const fact        = Math.round(scores?.factual ?? 0)

  // Dominant symptom
  const dims = [
    { name: "sensationalism", val: sens },
    { name: "bias",           val: bias },
    { name: "emotion",        val: emot },
    { name: "factual risk",   val: fact },
  ].sort((a, b) => b.val - a.val)
  const topDim = dims[0]

  const rows = [
    {
      label: "PATIENT",
      color: "#6366f1",
      value: `${wordCount.toLocaleString()} words · ${sentenceCount ?? "—"} sentences analyzed`,
      sub:   linksFound > 0
        ? `${linksFound} external link${linksFound !== 1 ? "s" : ""} scanned for credibility signals`
        : "No external hyperlinks detected in article body",
    },
    {
      label: "SYMPTOMS",
      color: "#f59e0b",
      value: `Sensationalism ${sens}  ·  Bias ${bias}  ·  Emotion ${emot}  ·  Fact Risk ${fact}`,
      sub:   `Primary concern: ${topDim.name} (${topDim.val}/100)${topDim.val >= 60 ? " — elevated" : topDim.val >= 40 ? " — moderate" : " — low"}`,
    },
    {
      label: "DIAGNOSIS",
      color: meta.color,
      value: `${verdict.toUpperCase()} — Overall risk score ${Math.round(score)}/100`,
      sub:   "3-model ensemble: RoBERTa (per-sentence) + MiniLM NLI (4-axis) + Fake-News Classifier (cross-validate)",
    },
    {
      label: "TREATMENT",
      color: "#06b6d4",
      value: verdict === "Credible"
        ? "Neutralization not required — language meets credibility threshold"
        : "AI rewrite generated via 4-tier LLM gateway (Groq → Gemini → HuggingFace → Template)",
      sub: "Calibration: MBFC source database + hyperlink credibility modifier",
    },
    {
      label: "PROGNOSIS",
      color: meta.color,
      value: PROGNOSIS_TEXT[verdict],
      sub:   "Verify with: Snopes · FactCheck.org · Reuters Fact Check · PolitiFact",
    },
  ]

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Misinformation Autopsy
            </h3>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
              Forensic credibility breakdown
            </p>
          </div>
        </div>

        {/* Verdict stamp */}
        <div
          className="text-[11px] font-black uppercase tracking-[0.18em] px-3 py-1 rounded-full font-mono"
          style={{
            background: meta.bg,
            color:      meta.color,
            border:     `1px solid ${meta.border}`,
          }}
        >
          {meta.stamp} · {Math.round(score)}/100
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {rows.map((row, i) => (
          <Row key={row.label} {...row} delay={i * 0.06} />
        ))}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        <span
          className="text-[10px] font-mono uppercase tracking-widest"
          style={{ color: "var(--text-3)" }}
        >
          TruthLens AI · truthlensai.me · 3 models · 2 calibration layers
        </span>
        <span
          className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded font-mono"
          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
        >
          {meta.stamp}
        </span>
      </div>
    </div>
  )
}
