import { motion } from "framer-motion"

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
}

const DIMENSIONS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    name: "Sensationalism",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.2)",
    desc: "Detects exaggerated language, clickbait phrasing, and emotionally charged headlines designed to provoke outrage or fear rather than inform.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
      </svg>
    ),
    name: "Bias",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    desc: "Identifies one-sided framing, loaded language, and selective omission of facts that present a skewed perspective rather than balanced reporting.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    name: "Emotion",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.2)",
    desc: "Measures the degree to which text relies on emotional appeals — anger, fear, hope — rather than evidence and logical reasoning to make its point.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
    name: "Fact Risk",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.2)",
    desc: "Estimates the likelihood that factual claims in the text are unverified, contested, or demonstrably false based on patterns learned from fact-checked datasets.",
  },
]

const LIMITATIONS = [
  {
    title: "Short texts",
    desc: "The model needs at least 4–8 sentences for meaningful analysis. Tweets, headlines, or single sentences produce low-confidence results.",
  },
  {
    title: "Satire & parody",
    desc: "Satirical articles (The Onion, The Babylon Bee) may score as suspicious due to intentionally sensational language — always consider the source.",
  },
  {
    title: "Non-English content",
    desc: "TruthLens was trained primarily on English-language datasets. Non-English text may produce unreliable scores.",
  },
  {
    title: "Cutting-edge events",
    desc: "The model cannot verify claims about events after its training cutoff. Recent news should always be cross-referenced with live fact-checking services.",
  },
  {
    title: "Expert opinion",
    desc: "Legitimate scientific debate or expert disagreement may be flagged as uncertain. The model cannot distinguish nuanced academic discourse from misinformation.",
  },
  {
    title: "Context dependence",
    desc: "A sentence that sounds suspicious in isolation may be perfectly accurate in its full context. Always read the full source article.",
  },
]

export default function About() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">

        {/* Hero */}
        <motion.div
          custom={0}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="text-center mb-16"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-medium"
            style={{
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
              color: "#818cf8",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            Methodology
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
            <span style={{
              background: "linear-gradient(to bottom, var(--text) 60%, var(--text-2))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              How TruthLens
            </span>
            <br />
            <span style={{
              background: "linear-gradient(135deg, #818cf8 0%, #c4b5fd 50%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Works
            </span>
          </h1>
          <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: "var(--text-2)" }}>
            TruthLens uses a fine-tuned transformer model to analyze text credibility at the sentence level,
            scoring four distinct dimensions of misinformation risk.
          </p>
        </motion.div>

        {/* Dimensions */}
        <motion.section custom={1} variants={fadeIn} initial="hidden" animate="visible" className="mb-14">
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Analysis Dimensions</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-3)" }}>
            Each sentence is scored across four independent dimensions of credibility risk.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DIMENSIONS.map((d, i) => (
              <motion.div
                key={d.name}
                custom={i * 0.5 + 2}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="card p-5"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: d.bg, border: `1px solid ${d.border}`, color: d.color }}
                  >
                    {d.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>
                      {d.name}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                      {d.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* The AI Model */}
        <motion.section custom={6} variants={fadeIn} initial="hidden" animate="visible" className="mb-14">
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>The AI Model</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-3)" }}>
            Built on state-of-the-art natural language processing research.
          </p>
          <div className="card p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>RoBERTa Base</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                  TruthLens uses <strong style={{ color: "var(--text)" }}>RoBERTa</strong> (Robustly Optimized BERT Pretraining Approach),
                  a transformer model developed by Meta AI. RoBERTa uses bidirectional self-attention to understand the full
                  context of each sentence — reading it from left to right and right to left simultaneously — making it
                  significantly better at detecting nuanced language patterns than older models.
                </p>
              </div>
            </div>

            <div
              className="h-px w-full"
              style={{ background: "var(--border)" }}
            />

            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>Fine-tuned on LIAR Dataset</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                  The model was fine-tuned on the <strong style={{ color: "var(--text)" }}>LIAR dataset</strong>, a benchmark
                  corpus of 12,800+ fact-checked political statements from PolitiFact, each labeled across six veracity
                  categories (true, mostly-true, half-true, barely-true, false, pants-fire). This teaches the model to
                  recognize linguistic patterns common in misleading statements.
                </p>
              </div>
            </div>

            <div className="h-px w-full" style={{ background: "var(--border)" }} />

            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>Sentence-Level Analysis</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                  Unlike document-level classifiers, TruthLens splits articles into individual sentences and scores each
                  one independently. This allows the system to pinpoint exactly which sentences carry the highest
                  misinformation risk — enabling the annotated article view and trust waveform visualization.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Scoring Formula */}
        <motion.section custom={7} variants={fadeIn} initial="hidden" animate="visible" className="mb-14">
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Scoring Formula</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-3)" }}>
            A weighted composite score that emphasizes worst-case sentences over the average.
          </p>
          <div className="card p-6">
            {/* Formula display */}
            <div
              className="rounded-xl px-5 py-4 mb-6 text-center font-mono text-sm"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              <span style={{ color: "#6366f1", fontWeight: 700 }}>Score</span>
              {" = "}
              <span style={{ color: "#10b981" }}>0.50 × mean</span>
              {" + "}
              <span style={{ color: "#f59e0b" }}>0.30 × avg(top-3)</span>
              {" + "}
              <span style={{ color: "#ef4444" }}>0.20 × NLI</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { weight: "50%", label: "Mean Score", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", desc: "Average credibility score across all sentences — represents the overall tone of the article." },
                { weight: "30%", label: "Top-3 Worst", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", desc: "Average score of the 3 most suspicious sentences — ensures a few bad sentences can raise the overall score." },
                { weight: "20%", label: "NLI Score", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", desc: "Natural Language Inference score measuring internal contradictions and factual inconsistency within the text." },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl p-4 text-center"
                  style={{ background: item.bg, border: `1px solid ${item.border}` }}
                >
                  <div className="text-2xl font-bold font-mono mb-1" style={{ color: item.color }}>{item.weight}</div>
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--text)" }}>{item.label}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Thresholds */}
            <div className="space-y-2">
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-2)" }}>Score Thresholds</p>
              {[
                { range: "0 – 44", label: "Credible", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", desc: "Low bias, factual language, minimal sensationalism." },
                { range: "45 – 61", label: "Uncertain", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", desc: "Mixed signals. Cross-reference with trusted sources." },
                { range: "62 – 100", label: "Suspicious", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", desc: "Strong indicators of bias, sensationalism, or false claims." },
              ].map((t) => (
                <div
                  key={t.range}
                  className="flex items-center justify-between rounded-lg px-4 py-3"
                  style={{ background: t.bg, border: `1px solid ${t.border}` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold" style={{ color: t.color }}>{t.range}</span>
                    <span className="text-xs font-semibold" style={{ color: t.color }}>{t.label}</span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-2)" }}>{t.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Limitations */}
        <motion.section custom={8} variants={fadeIn} initial="hidden" animate="visible" className="mb-14">
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Limitations</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-3)" }}>
            TruthLens is a tool to assist critical thinking — not a replacement for it. Here's what it can't do.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LIMITATIONS.map((lim, i) => (
              <motion.div
                key={lim.title}
                custom={i * 0.3 + 8}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="card p-5"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>{lim.title}</h4>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{lim.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          custom={14}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="card p-8 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.06) 100%)",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>Try It Now</h3>
          <p className="text-sm mb-5" style={{ color: "var(--text-2)" }}>
            Paste any article or URL and see TruthLens in action.
          </p>
          <a
            href="/"
            className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm"
          >
            Run an Analysis →
          </a>
        </motion.div>

      </div>
    </div>
  )
}
