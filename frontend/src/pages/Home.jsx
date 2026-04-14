import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Circle } from "lucide-react"
import { analyzeText, analyzeUrl, getStats } from "../services/api"
import { ElegantShape } from "../components/ui/ElegantShape"

const PILLS = ["Sentence-Level", "Bias Detection", "Emotion Analysis", "Factual Scoring"]

const EXAMPLES = [
  {
    label: "🔴 Conspiracy",
    text: "The moon landing was completely staged by NASA and Hollywood directors. Astronauts never actually left Earth's atmosphere. The footage was filmed in a secret desert studio and the entire mission was fabricated to win the space race against the Soviet Union.",
  },
  {
    label: "🟡 Misleading",
    text: "Scientists have confirmed that drinking bleach cures cancer overnight. The government has been hiding this miracle treatment for decades to protect pharmaceutical profits. Thousands of patients have already recovered using this secret method.",
  },
  {
    label: "🟢 Credible",
    text: "NASA's Apollo 11 mission successfully landed astronauts Neil Armstrong and Buzz Aldrin on the Moon on July 20, 1969. The mission was the result of years of scientific research, engineering development, and thousands of hours of astronaut training.",
  },
]

const EXAMPLE_URLS = [
  {
    label: "🟢 Wikipedia",
    url: "https://en.wikipedia.org/wiki/James_Webb_Space_Telescope",
  },
  {
    label: "🟢 BBC News",
    url: "https://www.bbc.com/news/science-environment-62885150",
  },
  {
    label: "🔴 The Onion",
    url: "https://www.theonion.com/scientists-warn-that-the-earth-is-slowly-drifting-out-1850923456",
  },
]

const LOADING_STEPS = ["Fetching content", "Parsing sentences", "Analyzing with AI", "Computing scores"]

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1, delay: 0.5 + i * 0.2, ease: [0.25, 0.4, 0.25, 1] },
  }),
}

const STATS = [
  { value: "4",    label: "Analysis Dimensions" },
  { value: "~2s",  label: "Avg Processing"      },
  { value: "100%", label: "Open Source"          },
]

export default function Home() {
  const [mode, setMode]               = useState("text")
  const [input, setInput]             = useState("")
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState("")
  const [loadingStep, setLoadingStep] = useState(0)
  const [totalAnalyses, setTotalAnalyses] = useState(null)
  const navigate = useNavigate()
  const MAX_CHARS = 8000

  // Fetch live stats on mount
  useEffect(() => {
    getStats()
      .then((res) => setTotalAnalyses(res.data.total_analyses))
      .catch(() => {})
  }, [])

  // Progress steps during loading
  useEffect(() => {
    if (!loading) {
      setLoadingStep(0)
      return
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev))
    }, 700)
    return () => clearInterval(interval)
  }, [loading])

  // Cmd/Ctrl + Enter shortcut
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && input.trim() && !loading) {
        e.preventDefault()
        handleSubmit(e)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [input, loading])

  async function handleSubmit(e) {
    e?.preventDefault()
    setError("")
    if (mode === "text" && input.length > MAX_CHARS) {
      setError(`Text too long (${input.length.toLocaleString()} chars). Max ${MAX_CHARS.toLocaleString()}.`)
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
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* Ambient gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.12), transparent 70%)",
        }}
      />

      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-indigo-500/[0.12]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />
        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-violet-500/[0.10]"
          className="right-[-5%] md:right-[0%] top-[65%] md:top-[72%]"
        />
        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-indigo-400/[0.10]"
          className="left-[5%] md:left-[10%] bottom-[8%] md:bottom-[12%]"
        />
        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-purple-500/[0.10]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[14%]"
        />
        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-blue-500/[0.08]"
          className="left-[20%] md:left-[25%] top-[5%] md:top-[8%]"
        />
      </div>

      {/* Top/bottom fade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, var(--bg) 0%, transparent 12%, transparent 88%, var(--bg) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-xl mx-auto px-4 py-16 flex flex-col items-center text-center">

        {/* Badge */}
        <motion.div
          custom={0}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-10"
          style={{
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          <Circle className="h-2 w-2 fill-indigo-400 text-indigo-400" />
          <span className="text-xs font-medium tracking-wide" style={{ color: "#818cf8" }}>
            AI-Powered · RoBERTa Model · Sentence-Level
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          custom={1}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <h1 className="text-5xl sm:text-7xl font-bold leading-[0.95] tracking-tight">
            <span
              style={{
                background: "linear-gradient(to bottom, var(--text) 60%, var(--text-2))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Detect
            </span>
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #818cf8 0%, #c4b5fd 50%, #6366f1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              misinformation
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          custom={2}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="text-base leading-relaxed mb-8 max-w-md font-light"
          style={{ color: "var(--text-2)" }}
        >
          Paste any article or URL. TruthLens analyzes credibility sentence-by-sentence
          using fine-tuned RoBERTa AI.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          custom={3}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap justify-center gap-2 mb-4"
        >
          {PILLS.map((p) => (
            <span
              key={p}
              className="px-3 py-1 text-xs font-medium rounded-full"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              {p}
            </span>
          ))}
        </motion.div>

        {/* Try an example buttons */}
        <motion.div
          custom={3}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap items-center justify-center gap-2 mb-8"
        >
          <span className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
            Try an example:
          </span>
          {mode === "text"
            ? EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => setInput(ex.text)}
                  className="px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 hover:opacity-80"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-2)",
                    cursor: "pointer",
                  }}
                >
                  {ex.label}
                </button>
              ))
            : EXAMPLE_URLS.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => setInput(ex.url)}
                  className="px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 hover:opacity-80"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-2)",
                    cursor: "pointer",
                  }}
                >
                  {ex.label}
                </button>
              ))
          }
        </motion.div>

        {/* Analysis card */}
        <motion.div
          custom={4}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="w-full mb-8"
        >
          <div className="card p-6">
            {/* Mode toggle */}
            <div
              className="flex rounded-lg p-0.5 mb-5"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              {[
                { key: "text", label: "Paste Text" },
                { key: "url",  label: "Enter URL"  },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setMode(key); setInput("") }}
                  className="flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200"
                  style={
                    mode === key
                      ? { background: "#6366f1", color: "#ffffff" }
                      : { background: "transparent", color: "var(--text-3)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "text" ? (
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste article content here..."
                    rows={6}
                    className="input-field w-full p-4 text-sm leading-relaxed resize-none rounded-xl"
                    required
                  />
                  <span
                    className="absolute bottom-3 right-3 text-xs font-mono"
                    style={{
                      color:
                        input.length > MAX_CHARS
                          ? "#ef4444"
                          : input.length > MAX_CHARS * 0.85
                          ? "var(--text-3)"
                          : "var(--border-strong)",
                    }}
                  >
                    {input.length.toLocaleString()}/{MAX_CHARS.toLocaleString()}
                  </span>
                </div>
              ) : (
                <input
                  type="url"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="https://example.com/article"
                  className="input-field w-full p-4 text-sm rounded-xl"
                  required
                />
              )}

              {error && (
                <div
                  className="flex items-center gap-2.5 text-sm rounded-xl px-4 py-3"
                  style={{
                    color: "#ef4444",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <svg className="shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="btn-primary flex-1 py-3 text-sm font-semibold rounded-xl"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      {/* Indigo spinner */}
                      <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      <span>{LOADING_STEPS[loadingStep]}</span>
                    </span>
                  ) : (
                    "Run Analysis →"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/history")}
                  className="btn-secondary px-5 py-3 text-sm rounded-xl"
                >
                  History
                </button>
              </div>

              {/* Keyboard shortcut hint */}
              <p className="text-xs text-center" style={{ color: "var(--text-3)" }}>
                ⌘↵ or Ctrl+↵ to submit
              </p>
            </form>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          custom={5}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="w-full pt-6"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Live analyses badge */}
          {totalAnalyses != null && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs" style={{ color: "var(--text-3)" }}>
                {totalAnalyses.toLocaleString()} articles analyzed
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-6 w-full">
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-2xl font-bold font-mono mb-0.5" style={{ color: "#6366f1" }}>
                  {value}
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
