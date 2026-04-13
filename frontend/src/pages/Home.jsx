import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { analyzeText, analyzeUrl } from "../services/api"

const STAGGER = {
  container: { animate: { transition: { staggerChildren: 0.08 } } },
  item: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  },
}

const STATS = [
  { value: "4",    label: "Analysis Dims" },
  { value: "~2s",  label: "Avg Speed"     },
  { value: "100%", label: "Open Source"   },
]

const PILLS = ["Sentence-Level", "Bias Detection", "Emotion Analysis", "Factual Scoring"]

export default function Home() {
  const [mode, setMode]       = useState("text")
  const [input, setInput]     = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const navigate = useNavigate()
  const cardRef = useRef(null)

  const MAX_CHARS = 8000

  // Spotlight effect
  function handleMouseMove(e) {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width)  * 100
    const y = ((e.clientY - rect.top)  / rect.height) * 100
    cardRef.current.style.setProperty("--mouse-x", x + "%")
    cardRef.current.style.setProperty("--mouse-y", y + "%")
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    if (mode === "text" && input.length > MAX_CHARS) {
      setError(`Text is too long (${input.length.toLocaleString()} chars). Max ${MAX_CHARS.toLocaleString()}.`)
      return
    }
    setLoading(true)
    try {
      const res = mode === "text" ? await analyzeText(input) : await analyzeUrl(input)
      navigate(`/results/${res.data.analysis_id}`)
    } catch (err) {
      const status = err.response?.status
      if (status === 429) setError("Rate limit hit — wait a moment and try again.")
      else setError(err.response?.data?.error || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">

      <motion.div
        variants={STAGGER.container}
        initial="initial"
        animate="animate"
        className="relative z-10 flex flex-col items-center text-center w-full max-w-xl mx-auto"
      >

        {/* System label */}
        <motion.div variants={STAGGER.item} className="mb-8">
          <span className="font-terminal text-xs tracking-[0.3em] text-white/60 uppercase border border-white/30 px-4 py-1.5 rounded-sm">
            SYSTEM_ONLINE // v2.0
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1 variants={STAGGER.item}
          className="text-5xl sm:text-7xl font-bold leading-[0.95] tracking-tight mb-6 text-white"
        >
          <span
            className="glitch block"
            data-text="TRUTH"
          >TRUTH</span>
          <span className="block text-white/50">LENS</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={STAGGER.item}
          className="font-terminal text-xs text-white/70 tracking-widest mb-10 leading-relaxed"
        >
          &gt; AI-POWERED CREDIBILITY ANALYSIS ENGINE<br />
          &gt; ROBERTA MODEL // SENTENCE-LEVEL DETECTION
        </motion.p>

        {/* Feature pills */}
        <motion.div variants={STAGGER.item} className="flex flex-wrap justify-center gap-2 mb-8">
          {PILLS.map((p) => (
            <span key={p}
              className="font-terminal px-3 py-1 text-[10px] tracking-widest uppercase text-white/60 border border-white/[0.25] rounded-sm"
            >{p}</span>
          ))}
        </motion.div>

        {/* Analysis card */}
        <motion.div variants={STAGGER.item} className="w-full mb-8">
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            className="spotlight-card p-6"
          >
            {/* Mode toggle */}
            <div className="flex bg-white/[0.03] rounded-sm p-0.5 mb-5 border border-white/[0.06]">
              {[
                { key: "text", label: "PASTE TEXT" },
                { key: "url",  label: "ENTER URL"  },
              ].map(({ key, label }) => (
                <button key={key}
                  onClick={() => { setMode(key); setInput("") }}
                  className={`flex-1 py-2 rounded-sm text-[10px] font-terminal tracking-[0.2em] transition-all duration-200 ${
                    mode === key
                      ? "bg-white text-black font-bold"
                      : "text-white/25 hover:text-white/60"
                  }`}
                >{label}</button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "text" ? (
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="> paste article content here..."
                    rows={6}
                    className="input-mono w-full rounded-sm p-4 text-[11px] leading-relaxed resize-none"
                    required
                  />
                  <span className={`absolute bottom-3 right-3 text-[10px] font-terminal ${
                    input.length > MAX_CHARS ? "text-white/70" :
                    input.length > MAX_CHARS * 0.85 ? "text-white/40" : "text-white/15"
                  }`}>
                    {input.length.toLocaleString()}/{MAX_CHARS.toLocaleString()}
                  </span>
                </div>
              ) : (
                <input
                  type="url"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="> https://example.com/article"
                  className="input-mono w-full rounded-sm p-4 text-[11px]"
                  required
                />
              )}

              {error && (
                <div className="flex items-start gap-2.5 text-white/60 text-[11px] font-terminal bg-white/[0.03] border border-white/[0.1] rounded-sm px-4 py-3">
                  <span className="shrink-0">! ERR</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="btn-primary flex-1 py-3 rounded-sm text-[11px] font-terminal tracking-[0.2em] uppercase"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2.5">
                      <span className="flex gap-1">
                        <span className="dot-bounce w-1.5 h-1.5 rounded-full bg-black" />
                        <span className="dot-bounce w-1.5 h-1.5 rounded-full bg-black" />
                        <span className="dot-bounce w-1.5 h-1.5 rounded-full bg-black" />
                      </span>
                      ANALYZING...
                    </span>
                  ) : "RUN ANALYSIS →"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/history")}
                  className="btn-outline px-5 py-3 rounded-sm text-[10px] font-terminal tracking-[0.2em] uppercase"
                >
                  HISTORY
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={STAGGER.item} className="grid grid-cols-3 gap-6 w-full border-t border-white/[0.06] pt-6">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="text-2xl font-bold font-terminal text-white mb-1">{value}</span>
              <span className="text-[9px] font-terminal text-white/55 uppercase tracking-[0.2em]">{label}</span>
            </div>
          ))}
        </motion.div>

      </motion.div>
    </section>
  )
}
