import { Link } from "react-router-dom"
import { motion } from "framer-motion"

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-sm w-full"
      >
        {/* Big 404 */}
        <div className="mb-6">
          <span
            className="text-8xl font-bold font-mono"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </span>
        </div>

        <div
          className="w-12 h-12 rounded-full mx-auto mb-5 flex items-center justify-center"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-3)" }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            <path d="M11 8v4M11 16h.01"/>
          </svg>
        </div>

        <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>
          Page not found
        </h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--text-3)" }}>
          This analysis or page doesn't exist, or the link may have expired.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="btn-primary px-6 py-2.5 text-sm font-semibold rounded-xl"
          >
            Run New Analysis →
          </Link>
          <Link
            to="/history"
            className="btn-outline px-6 py-2.5 text-sm rounded-xl"
          >
            View History
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
