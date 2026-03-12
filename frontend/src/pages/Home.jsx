import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { analyzeText, analyzeUrl } from "../services/api"

const STAGGER = {
  container: { animate: { transition: { staggerChildren: 0.1 } } },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  },
}

const STATS = [
  { value: "4",    label: "Analysis Dimensions" },
  { value: "~2s",  label: "Avg Response Time"   },
  { value: "100%", label: "Open Source"          },
]

const PILLS = ["Sentence-Level", "Bias Detection", "Emotion Analysis", "Factual Scoring"]

export default function Home() {
  const [mode, setMode]       = useState("text")
  const [input, setInput]     = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = mode === "text"
        ? await analyzeText(input)
        : await analyzeUrl(input)
      navigate(`/results/${res.data.analysis_id}`)
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

      {/* ── Content ── */}
      <motion.div
        variants={STAGGER.container}
        initial="initial"
        animate="animate"
        className="relative z-10 flex flex-col items-center text-center px-4 w-full max-w-2xl mx-auto"
      >
        {/* Feature pills */}
        <motion.div variants={STAGGER.item} className="flex flex-wrap justify-center gap-2 mb-10">
          {PILLS.map((p) => (
            <span
              key={p}
              className="px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-slate-400 backdrop-blur-sm tracking-wide"
            >
              {p}
            </span>
          ))}
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={STAGGER.item}
          className="text-5xl sm:text-7xl font-bold leading-tight tracking-tight mb-4"
        >
          <span className="text-white">Detect</span>{" "}
          <span
            className="inline-block"
            style={{
              background: "linear-gradient(135deg, #06b6d4 0%, #a855f7 60%, #06b6d4 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Misinformation
          </span>
          <br />
          <span className="text-white">Instantly.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={STAGGER.item}
          className="text-slate-400 text-lg sm:text-xl max-w-xl mb-10 leading-relaxed"
        >
          AI-powered, sentence-level credibility analysis using RoBERTa.
          Paste any article or URL and get results in seconds.
        </motion.p>

        {/* Analysis card */}
        <motion.div variants={STAGGER.item} className="w-full mb-10">
          <div
            className="rounded-2xl p-[1px]"
            style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.3), rgba(168,85,247,0.3), rgba(6,182,212,0.1))" }}
          >
            <div className="rounded-2xl bg-[#07101f]/90 backdrop-blur-xl p-6">
              {/* Mode toggle */}
              <div className="flex bg-black/40 rounded-xl p-1 mb-5 border border-white/[0.05]">
                {[
                  { key: "text", label: "Paste Text" },
                  { key: "url",  label: "Enter URL"  },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setMode(key); setInput("") }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      mode === key
                        ? "bg-cyan-500/[0.15] text-cyan-400 border border-cyan-500/25"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "text" ? (
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste your article here — minimum 50 characters..."
                    rows={6}
                    className="input-neon w-full rounded-xl p-4 text-sm leading-relaxed resize-none font-mono"
                    required
                  />
                ) : (
                  <input
                    type="url"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="https://example.com/article"
                    className="input-neon w-full rounded-xl p-4 text-sm font-mono"
                    required
                  />
                )}

                {error && (
                  <div className="flex items-start gap-2.5 text-red-400 text-sm bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3">
                    <span className="shrink-0 mt-px">⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="btn-neon flex-1 py-3 rounded-xl text-sm tracking-wider uppercase font-semibold"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2.5">
                        <span className="flex gap-1">
                          <span className="dot-bounce w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span className="dot-bounce w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span className="dot-bounce w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        </span>
                        Analyzing…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Analyze Article
                        <span className="text-base">→</span>
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/history")}
                    className="px-5 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] transition-all duration-200 backdrop-blur-sm tracking-wide uppercase"
                  >
                    History
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={STAGGER.item}
          className="grid grid-cols-3 gap-6 w-full"
        >
          {STATS.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              <span
                className="text-3xl font-bold font-mono mb-1"
                style={{
                  background: "linear-gradient(135deg, #67e8f9, #c084fc)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {value}
              </span>
              <span className="text-xs text-slate-600 uppercase tracking-widest">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
