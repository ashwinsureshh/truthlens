import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  motion, animate,
  useScroll, useTransform,
  useMotionValue, useSpring, useMotionTemplate,
  AnimatePresence,
} from "framer-motion"
import { analyzeText, analyzeUrl, getStats } from "../services/api"
import { useStreamingAnalysis } from "../hooks/useStreamingAnalysis"
import StreamingOverlay from "../components/ui/StreamingOverlay"

/* ─────────────────────────────────────────────
   21ST.DEV — ElegantShape (shape-landing-hero)
   Floating frosted-glass pill shapes for hero bg
───────────────────────────────────────────────*/
function ElegantShape({
  className = "",
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={`absolute ${className}`}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{ width, height, willChange: "transform" }}
        className="relative"
      >
        <div
          style={{ width, height }}
          className={[
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "border border-white/[0.12]",
            "shadow-[0_8px_32px_0_rgba(255,255,255,0.06)]",
          ].join(" ")}
        />
      </motion.div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   21ST.DEV — Shiny badge shimmer
───────────────────────────────────────────────*/
function ShinyBadge({ children }) {
  return (
    <div
      className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full overflow-hidden"
      style={{
        background: "rgba(99,102,241,0.1)",
        border: "1px solid rgba(99,102,241,0.25)",
      }}
    >
      <style>{`
        @keyframes shiny-slide {
          0%   { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateX(300%) skewX(-15deg); opacity: 0; }
        }
      `}</style>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
          animation: "shiny-slide 3.5s ease-in-out infinite",
        }}
      />
      <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
      <span className="relative z-10 text-xs font-medium tracking-wide" style={{ color: "#818cf8" }}>
        {children}
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────
   21ST.DEV — TextEffect (ibelick)
   blur | slide | fade presets, per word/char
───────────────────────────────────────────────*/
function TextEffect({
  children,
  per = "word",
  preset = "blur",
  delay = 0,
  className = "",
  style,
  as = "p",
  once = true,
}) {
  const segments =
    per === "word" ? children.split(/(\s+)/)
    : per === "char" ? children.split("")
    : children.split("\n")

  const itemVariants = {
    blur: {
      hidden: { opacity: 0, filter: "blur(12px)" },
      visible: { opacity: 1, filter: "blur(0px)" },
    },
    slide: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
  }[preset] || { hidden: { opacity: 0 }, visible: { opacity: 1 } }

  const Tag = motion[as] || motion.p

  return (
    <Tag
      className={`whitespace-pre-wrap ${className}`}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: per === "char" ? 0.03 : 0.06,
            delayChildren: delay,
          },
        },
      }}
    >
      {segments.map((seg, i) => (
        <motion.span
          key={i}
          variants={itemVariants}
          className="inline-block whitespace-pre"
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {seg}
        </motion.span>
      ))}
    </Tag>
  )
}

/* ─────────────────────────────────────────────
   21ST.DEV — Marquee (infinite scrolling ticker)
───────────────────────────────────────────────*/
const NEWS_SOURCES = [
  "Reuters", "BBC News", "AP News", "NPR", "The Guardian",
  "Snopes", "FactCheck.org", "PolitiFact", "Bloomberg", "Axios",
  "The New York Times", "Washington Post", "The Economist", "AFP",
]

function Marquee({ items = NEWS_SOURCES, speed = 35, label = "" }) {
  return (
    <div className="relative py-10 overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <style>{`
        @keyframes marquee-x { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { animation: marquee-x ${speed}s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>
      {label && (
        <p className="text-center mb-5 text-xs tracking-widest uppercase" style={{ color: "var(--text-3)", letterSpacing: "0.14em" }}>
          {label}
        </p>
      )}
      <div
        className="relative overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <div className="marquee-track flex items-center gap-10" style={{ width: "max-content" }}>
          {[...items, ...items].map((src, i) => (
            <span
              key={i}
              className="text-sm font-semibold whitespace-nowrap select-none"
              style={{ color: "var(--text-3)", letterSpacing: "0.04em" }}
            >
              {src}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   HELPER: Text mask reveal (slides up from clip)
───────────────────────────────────────────────*/
function Reveal({ children, delay = 0, className = "" }) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span
        className="block"
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 0.95, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  )
}

/* ─────────────────────────────────────────────
   HELPER: Magnetic button (cursor follows)
───────────────────────────────────────────────*/
function MagneticButton({ children, onClick, className, style, disabled }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 28 })
  const springY = useSpring(y, { stiffness: 300, damping: 28 })

  const handleMove = (e) => {
    if (disabled) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - (rect.left + rect.width / 2)) * 0.28)
    y.set((e.clientY - (rect.top + rect.height / 2)) * 0.28)
  }
  const handleLeave = () => { x.set(0); y.set(0) }

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY, ...style }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      className={className}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      disabled={disabled}
    >
      {children}
    </motion.button>
  )
}

/* ─────────────────────────────────────────────
   HELPER: Spotlight card (mouse-tracking glow)
───────────────────────────────────────────────*/
function SpotlightCard({ children, className = "" }) {
  const ref = useRef(null)
  const mouseX = useMotionValue(-999)
  const mouseY = useMotionValue(-999)
  const [hovered, setHovered] = useState(false)

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  const bg = useMotionTemplate`radial-gradient(
    480px circle at ${mouseX}px ${mouseY}px,
    rgba(99,102,241,0.10),
    transparent 80%
  )`

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`spotlight-wrap ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
        style={{ background: bg, opacity: hovered ? 1 : 0 }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   HELPER: Scroll-reveal wrapper
───────────────────────────────────────────────*/
function ScrollReveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   HELPER: Animated counter
───────────────────────────────────────────────*/
function AnimatedCount({ target, duration = 2 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView || !target) return
    const controls = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setCount(Math.round(v)),
    })
    return controls.stop
  }, [inView, target])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────*/
const LOADING_STEPS = ["Fetching content", "Parsing sentences", "Analyzing with AI", "Computing scores"]

const EXAMPLES = [
  {
    label: "Conspiracy",
    accent: "#ef4444",
    text: "The moon landing was completely staged by NASA and Hollywood directors. Astronauts never actually left Earth's atmosphere. The footage was filmed in a secret desert studio and the entire mission was fabricated to win the space race against the Soviet Union.",
  },
  {
    label: "Misleading",
    accent: "#f59e0b",
    text: "Scientists have confirmed that drinking bleach cures cancer overnight. The government has been hiding this miracle treatment for decades to protect pharmaceutical profits. Thousands of patients have already recovered using this secret method.",
  },
  {
    label: "Credible",
    accent: "#10b981",
    text: "NASA's Apollo 11 mission successfully landed astronauts Neil Armstrong and Buzz Aldrin on the Moon on July 20, 1969. The mission was the result of years of scientific research, engineering development, and thousands of hours of astronaut training.",
  },
]

const EXAMPLE_URLS = [
  { label: "Wikipedia", accent: "#10b981", url: "https://en.wikipedia.org/wiki/James_Webb_Space_Telescope" },
  { label: "Reuters", accent: "#10b981", url: "https://en.wikipedia.org/wiki/Climate_change" },
  { label: "Conspiracy", accent: "#ef4444", url: "https://en.wikipedia.org/wiki/Moon_landing_conspiracy_theories" },
]

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z"/><path d="M7 5h.01M7 12h.01M7 19h.01"/>
      </svg>
    ),
    title: "Sentence-Level Analysis",
    description: "Every sentence is scored independently — not just the document as a whole. Pinpoint exactly which claims are problematic.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: "4-Axis Scoring",
    description: "Sensationalism, bias, emotional manipulation, and factual risk — each measured separately and combined into one credibility score.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
    ),
    title: "Open Source & Private",
    description: "No API keys needed. Runs entirely on your infrastructure. Your articles never leave your environment.",
  },
]

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────*/
export default function Home() {
  const [mode, setMode]               = useState("text")
  const [input, setInput]             = useState("")
  const [error, setError]             = useState("")
  const [loadingStep, setLoadingStep] = useState(0)
  const [totalAnalyses, setTotalAnalyses] = useState(null)
  const navigate   = useNavigate()
  const stream     = useStreamingAnalysis()
  const analyzerRef = useRef(null)
  const MAX_CHARS  = 8000

  // Hero scroll parallax
  const heroRef = useRef(null)
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const heroOpacity = useTransform(heroProgress, [0, 0.7], [1, 0])
  const heroY       = useTransform(heroProgress, [0, 1], [0, -100])

  // Live stats
  useEffect(() => {
    getStats().then((r) => setTotalAnalyses(r.data.total_analyses)).catch(() => {})
  }, [])

  // Loading step ticker
  useEffect(() => {
    if (!loading) { setLoadingStep(0); return }
    const t = setInterval(
      () => setLoadingStep((p) => (p < LOADING_STEPS.length - 1 ? p + 1 : p)),
      700
    )
    return () => clearInterval(t)
  }, [loading])

  // Keyboard shortcut
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && input.trim() && !loading) {
        e.preventDefault(); handleSubmit(e)
      }
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [input, loading])

  async function handleSubmit(e) {
    e?.preventDefault()
    setError("")
    if (mode === "text" && input.length > MAX_CHARS) {
      setError(`Text too long (${input.length.toLocaleString()} chars). Max ${MAX_CHARS.toLocaleString()}.`)
      return
    }
    if (mode === "url" && input.trim() && !input.trim().startsWith("http")) {
      setError("Please enter a full URL starting with https://")
      return
    }
    if (mode === "text" && input.trim().split(/\s+/).length < 10) {
      setError("Please paste at least a sentence or two for meaningful analysis.")
      return
    }
    // Kick off streaming analysis — overlay handles the rest
    stream.start({ mode, input })
  }

  // Navigate to results when streaming pipeline finishes saving
  useEffect(() => {
    if (!stream.analysisId) return
    const token = localStorage.getItem("token")
    if (!token && stream.final) {
      const gh = JSON.parse(localStorage.getItem("guest_history") || "[]")
      gh.unshift({
        id: stream.analysisId,
        overall_score: stream.final.overall_score,
        input_type: mode,
        source_url: mode === "url" ? input : null,
        text_preview: mode === "text" ? input.trim().slice(0, 80) : null,
        created_at: new Date().toISOString(),
      })
      localStorage.setItem("guest_history", JSON.stringify(gh.slice(0, 20)))
    }
    // brief pause so users see the "complete" state
    const t = setTimeout(() => navigate(`/results/${stream.analysisId}`), 650)
    return () => clearTimeout(t)
  }, [stream.analysisId])

  // Surface streaming errors in the inline error banner
  useEffect(() => {
    if (stream.error) setError(stream.error)
  }, [stream.error])

  const loading = stream.active

  const canSubmit = !loading && !!input.trim()

  const scrollToAnalyzer = () => {
    analyzerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <div style={{ overflowX: "hidden", position: "relative" }}>

      {/* ══════════════════════════════════════
          GLOBAL BACKGROUND — grid + noise + orbs
      ══════════════════════════════════════ */}
      <style>{`
        @keyframes orb-breathe-a {
          0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.7; }
          50%      { transform: translate(-50%,-50%) scale(1.18); opacity: 1; }
        }
        @keyframes orb-breathe-b {
          0%,100% { transform: scale(1); opacity: 0.5; }
          50%      { transform: scale(1.25); opacity: 0.85; }
        }
        @keyframes orb-breathe-c {
          0%,100% { transform: scale(1) rotate(0deg); opacity: 0.4; }
          50%      { transform: scale(1.15) rotate(8deg); opacity: 0.75; }
        }
        @keyframes grain {
          0%,100% { transform: translate(0,0); }
          10% { transform: translate(-2%,-3%); }
          20% { transform: translate(3%,2%); }
          30% { transform: translate(-1%,4%); }
          40% { transform: translate(2%,-2%); }
          50% { transform: translate(-3%,1%); }
          60% { transform: translate(1%,3%); }
          70% { transform: translate(-2%,-1%); }
          80% { transform: translate(3%,-3%); }
          90% { transform: translate(-1%,2%); }
        }
        .bg-grid-layer {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          will-change: transform;
          contain: strict;
          background-image:
            linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%);
        }
        .bg-noise-layer {
          position: fixed;
          inset: -50%;
          width: 200%;
          height: 200%;
          pointer-events: none;
          z-index: 0;
          opacity: 0.028;
          will-change: transform;
          contain: strict;
          animation: grain 7s steps(1) infinite;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }
        .bg-orb-a {
          position: fixed; pointer-events: none; z-index: 0; border-radius: 50%;
          width: 900px; height: 900px;
          top: 50%; left: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 65%);
          filter: blur(60px);
          will-change: transform, opacity;
          animation: orb-breathe-a 9s ease-in-out infinite;
        }
        .bg-orb-b {
          position: fixed; pointer-events: none; z-index: 0; border-radius: 50%;
          width: 600px; height: 600px;
          top: -5%; left: -8%;
          background: radial-gradient(circle, rgba(139,92,246,0.11) 0%, transparent 65%);
          filter: blur(80px);
          will-change: transform, opacity;
          animation: orb-breathe-b 12s ease-in-out infinite 2s;
        }
        .bg-orb-c {
          position: fixed; pointer-events: none; z-index: 0; border-radius: 50%;
          width: 500px; height: 500px;
          bottom: 10%; right: -5%;
          background: radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 65%);
          filter: blur(80px);
          will-change: transform, opacity;
          animation: orb-breathe-c 14s ease-in-out infinite 4s;
        }
        @media (prefers-reduced-motion: reduce) {
          .bg-orb-a, .bg-orb-b, .bg-orb-c, .bg-noise-layer { animation: none !important; }
          .marquee-track { animation-play-state: paused !important; }
        }
      `}</style>
      <div className="bg-grid-layer" />
      <div className="bg-noise-layer" />
      <div className="bg-orb-a" />
      <div className="bg-orb-b" />
      <div className="bg-orb-c" />

      {/* ══════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════ */}
      <motion.section
        ref={heroRef}
        className="relative flex flex-col items-center justify-center text-center overflow-hidden"
        style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "60px", opacity: heroOpacity, y: heroY, position: "relative", zIndex: 1 }}
      >

        {/* Floating shapes — 21st.dev ElegantShape */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <ElegantShape
            delay={0.3} width={580} height={130} rotate={12}
            gradient="from-indigo-500/[0.12]"
            className="left-[-8%] top-[18%]"
          />
          <ElegantShape
            delay={0.5} width={460} height={110} rotate={-15}
            gradient="from-violet-500/[0.10]"
            className="right-[-4%] top-[65%]"
          />
          <ElegantShape
            delay={0.4} width={280} height={70} rotate={-8}
            gradient="from-indigo-400/[0.10]"
            className="left-[8%] bottom-[8%]"
          />
          <ElegantShape
            delay={0.6} width={190} height={55} rotate={20}
            gradient="from-violet-400/[0.12]"
            className="right-[18%] top-[12%]"
          />
          <ElegantShape
            delay={0.7} width={140} height={38} rotate={-25}
            gradient="from-indigo-300/[0.10]"
            className="left-[22%] top-[8%]"
          />
        </div>

        {/* Badge — 21st.dev ShinyBadge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <ShinyBadge>AI-Powered · Fine-tuned RoBERTa · Sentence-Level</ShinyBadge>
        </motion.div>

        {/* Headline — text mask reveal */}
        <div className="mb-6 px-4">
          <Reveal delay={0.15}>
            <h1 className="hero-display" style={{ color: "var(--text)" }}>Detect</h1>
          </Reveal>
          <Reveal delay={0.3}>
            <h1 className="hero-display gradient-text">misinformation.</h1>
          </Reveal>
        </div>

        {/* Subtitle — 21st.dev TextEffect blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="mb-10 px-4"
        >
          <TextEffect
            as="p"
            preset="blur"
            per="word"
            delay={0.65}
            once={false}
            className="max-w-md text-lg leading-relaxed font-light text-center mx-auto"
            style={{ color: "var(--text-2)" }}
          >
            Paste any article or URL. TruthLens scores credibility sentence-by-sentence using fine-tuned AI.
          </TextEffect>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-center justify-center gap-3 mb-12 px-4"
        >
          <MagneticButton
            onClick={scrollToAnalyzer}
            className="btn-hero-primary"
          >
            Start analyzing
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </MagneticButton>

          <motion.a
            href="#features"
            className="btn-hero-ghost"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            How it works
          </motion.a>
        </motion.div>

        {/* Live counter */}
        {totalAnalyses != null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm" style={{ color: "var(--text-3)" }}>
              {totalAnalyses.toLocaleString()} articles analyzed
            </span>
          </motion.div>
        )}

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-3)", fontSize: "10px", letterSpacing: "0.15em" }}>Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--text-3)" }}>
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════
          SECTION 1.5 — MARQUEE (21st.dev)
      ══════════════════════════════════════ */}
      <Marquee label="Trained on content from" speed={40} />

      {/* ══════════════════════════════════════
          SECTION 2 — ANALYZER
      ══════════════════════════════════════ */}
      <section
        ref={analyzerRef}
        className="relative py-32 px-4"
        style={{ position: "relative", zIndex: 1, contain: "layout style" }}
      >
        {/* Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <ElegantShape delay={0} width={340} height={85} rotate={-10} gradient="from-violet-500/[0.08]" className="right-[-4%] top-[10%]" />
          <ElegantShape delay={0.15} width={220} height={58} rotate={14} gradient="from-indigo-400/[0.07]" className="left-[-3%] bottom-[15%]" />
        </div>

        <div className="relative max-w-xl mx-auto">
          {/* Section eyebrow */}
          <ScrollReveal className="text-center mb-4">
            <span className="section-label">Analyze now</span>
          </ScrollReveal>

          <ScrollReveal delay={0.05} className="text-center mb-10">
            <TextEffect as="h2" preset="slide" per="word" delay={0.05} className="section-title" style={{ color: "var(--text)" }}>
              Drop in any article.
            </TextEffect>
            <p className="mt-3 text-base" style={{ color: "var(--text-2)" }}>
              URL or raw text — AI does the rest.
            </p>
          </ScrollReveal>

          {/* Examples */}
          <ScrollReveal delay={0.1} className="mb-5">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-medium" style={{ color: "var(--text-3)" }}>Try an example:</span>
              {(mode === "text" ? EXAMPLES : EXAMPLE_URLS).map((ex) => (
                <motion.button
                  key={ex.label}
                  onClick={() => setInput(ex.text || ex.url)}
                  className="relative px-3 py-1.5 text-xs font-medium rounded-lg overflow-hidden flex items-center gap-2"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--text-2)",
                    cursor: "pointer",
                  }}
                  whileHover={{ scale: 1.05, background: `${ex.accent}10` }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  {/* Glowing left accent stripe */}
                  <span
                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg"
                    style={{
                      background: ex.accent,
                      boxShadow: `0 0 8px 2px ${ex.accent}`,
                    }}
                  />
                  {ex.label}
                </motion.button>
              ))}
            </div>
          </ScrollReveal>

          {/* Spotlight analysis card */}
          <ScrollReveal delay={0.12}>
            <SpotlightCard>
              <div className="p-6">
                {/* Mode toggle — spring slider */}
                <div
                  className="relative flex rounded-xl p-0.5 mb-5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <motion.div
                    className="absolute top-0.5 rounded-lg pointer-events-none"
                    style={{
                      background: "#6366f1",
                      bottom: "2px",
                      width: "calc(50% - 2px)",
                      boxShadow: "0 2px 12px rgba(99,102,241,0.5)",
                    }}
                    animate={{ left: mode === "text" ? "2px" : "50%" }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                  {[{ key: "text", label: "Paste Text" }, { key: "url", label: "Enter URL" }].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => { setMode(key); setInput("") }}
                      className="relative z-10 flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
                      style={{ color: mode === key ? "#ffffff" : "var(--text-3)" }}
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
                        style={{ background: "rgba(255,255,255,0.03)" }}
                        required
                      />
                      <span
                        className="absolute bottom-3 right-3 text-xs font-mono"
                        style={{
                          color: input.length > MAX_CHARS ? "#ef4444"
                            : input.length > MAX_CHARS * 0.85 ? "var(--text-3)"
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
                      style={{ background: "rgba(255,255,255,0.03)" }}
                      required
                    />
                  )}

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2.5 text-sm rounded-xl px-4 py-3"
                        style={{
                          color: "#ef4444",
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.18)",
                        }}
                      >
                        <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                        </svg>
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3">
                    <MagneticButton
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className="btn-hero-primary flex-1 rounded-xl"
                      style={{
                        opacity: canSubmit ? 1 : 0.4,
                        cursor: canSubmit ? "pointer" : "not-allowed",
                        borderRadius: "12px",
                        padding: "12px 20px",
                        fontSize: "14px",
                        justifyContent: "center",
                      }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          {LOADING_STEPS[loadingStep]}
                        </span>
                      ) : (
                        "Run Analysis →"
                      )}
                    </MagneticButton>

                    <motion.button
                      type="button"
                      onClick={() => navigate("/history")}
                      className="btn-secondary px-5 rounded-xl text-sm"
                      style={{ borderRadius: "12px", padding: "12px 20px" }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      History
                    </motion.button>
                  </div>

                  <p className="text-xs text-center" style={{ color: "var(--text-3)" }}>
                    ⌘↵ or Ctrl+↵ to submit
                  </p>
                </form>
              </div>
            </SpotlightCard>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 3 — FEATURES
      ══════════════════════════════════════ */}
      <section id="features" className="py-32 px-4 overflow-hidden" style={{ position: "relative", zIndex: 1, contain: "layout style" }}>
        {/* Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <ElegantShape delay={0} width={420} height={100} rotate={8} gradient="from-indigo-500/[0.08]" className="left-[-6%] top-[20%]" />
          <ElegantShape delay={0.2} width={200} height={52} rotate={-18} gradient="from-violet-400/[0.07]" className="right-[-2%] bottom-[20%]" />
          <ElegantShape delay={0.1} width={160} height={42} rotate={22} gradient="from-indigo-300/[0.06]" className="right-[12%] top-[8%]" />
        </div>
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-4">
            <span className="section-label">Capabilities</span>
          </ScrollReveal>
          <ScrollReveal delay={0.05} className="text-center mb-16">
            <TextEffect as="h2" preset="blur" per="word" delay={0.05} className="section-title" style={{ color: "var(--text)" }}>
              Built different.
            </TextEffect>
            <p className="mt-4 text-base max-w-lg mx-auto" style={{ color: "var(--text-2)" }}>
              Most fact-checkers give you a single score. TruthLens gives you a breakdown.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="feature-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
              >
                <motion.div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  {f.icon}
                </motion.div>
                <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text)" }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 4 — STATS
      ══════════════════════════════════════ */}
      <section className="py-32 px-4 relative overflow-hidden" style={{ position: "relative", zIndex: 1, contain: "layout style" }}>
        <div className="orb" style={{ width: 800, height: 400, top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
        {/* Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <ElegantShape delay={0} width={300} height={72} rotate={-12} gradient="from-violet-500/[0.08]" className="left-[-4%] top-[15%]" />
          <ElegantShape delay={0.2} width={180} height={48} rotate={16} gradient="from-indigo-400/[0.07]" className="right-[-2%] top-[30%]" />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <TextEffect as="h2" preset="blur" per="word" delay={0.0} className="section-title" style={{ color: "var(--text)" }}>
              Numbers that matter.
            </TextEffect>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              {
                value: totalAnalyses,
                suffix: "+",
                label: "Articles analyzed",
                note: "and counting",
                isAnimated: true,
              },
              {
                value: 4,
                suffix: "",
                label: "Analysis dimensions",
                note: "bias · emotion · fact · sensationalism",
                isAnimated: true,
              },
              {
                value: "~2",
                suffix: "s",
                label: "Avg processing time",
                note: "per article",
                isAnimated: false,
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className="text-6xl font-bold font-mono mb-2"
                  style={{
                    color: "#6366f1",
                    letterSpacing: "-0.04em",
                    textShadow: "0 0 40px rgba(99,102,241,0.4)",
                  }}
                >
                  {stat.isAnimated && stat.value != null ? (
                    <><AnimatedCount target={stat.value} />{stat.suffix}</>
                  ) : (
                    <>{stat.value}{stat.suffix}</>
                  )}
                </div>
                <p className="text-base font-medium mb-1" style={{ color: "var(--text)" }}>{stat.label}</p>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>{stat.note}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 5 — FINAL CTA
      ══════════════════════════════════════ */}
      <section className="py-32 px-4 text-center relative overflow-hidden" style={{ position: "relative", zIndex: 1, contain: "layout style" }}>
        <div className="orb" style={{ width: 600, height: 600, top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
        {/* Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <ElegantShape delay={0} width={380} height={90} rotate={10} gradient="from-indigo-500/[0.09]" className="left-[-5%] top-[25%]" />
          <ElegantShape delay={0.15} width={260} height={65} rotate={-14} gradient="from-violet-400/[0.08]" className="right-[-3%] bottom-[25%]" />
          <ElegantShape delay={0.25} width={150} height={40} rotate={-20} gradient="from-indigo-300/[0.07]" className="right-[20%] top-[10%]" />
        </div>
        <ScrollReveal className="relative max-w-xl mx-auto">
          <p className="section-label mb-4">Ready?</p>
          <TextEffect as="h2" preset="blur" per="word" delay={0.0} className="section-title mb-6" style={{ color: "var(--text)" }}>
            Stop guessing. Start analyzing.
          </TextEffect>
          <p className="text-base mb-10" style={{ color: "var(--text-2)" }}>
            Free, open source, no account required.
          </p>
          <MagneticButton onClick={scrollToAnalyzer} className="btn-hero-primary mx-auto">
            Analyze an article
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </MagneticButton>
        </ScrollReveal>
      </section>

      <StreamingOverlay
        open={stream.active || !!stream.final}
        meta={stream.meta}
        dimensions={stream.dimensions}
        sentences={stream.sentences}
        progress={stream.progress}
        final={stream.final}
        error={stream.error}
        onCancel={() => { stream.cancel(); stream.reset() }}
      />
    </div>
  )
}
