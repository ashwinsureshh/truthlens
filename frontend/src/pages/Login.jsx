import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { login, register } from "../services/api"

export default function Login() {
  const [mode, setMode]         = useState("login")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    try {
      const res = mode === "login"
        ? await login(email, password)
        : await register(email, password)
      localStorage.setItem("token", res.data.token)
      navigate("/")
    } catch (err) {
      setError(err.response?.data?.error || "Authentication failed.")
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex flex-col items-center gap-3 mb-4">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12">
              <circle cx="20" cy="20" r="20" fill="#6366f1" />
              <circle cx="20" cy="20" r="19" fill="#1e1b4b" />
              <path d="M14.5 14.5 A8 8 0 0 0 14.5 25.5"  stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              <path d="M11.5 11.5 A12 12 0 0 0 11.5 28.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              <path d="M8.5 8.5  A16 16 0 0 0 8.5 31.5"  stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              <path d="M16 20 C18 15.5 26 15.5 30 20 C26 24.5 18 24.5 16 20 Z" fill="white" />
              <circle cx="25" cy="20" r="3.2" fill="#1e1b4b" />
              <circle cx="26" cy="18.8" r="1.1" fill="white" />
            </svg>
            <span className="text-lg font-bold" style={{ color: "var(--text)" }}>TruthLens</span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            {mode === "login" ? "Sign in to your account" : "Create a free account"}
          </p>
        </div>

        {/* Benefits */}
        {mode === "register" && (
          <div
            className="rounded-xl px-4 py-3 mb-5 space-y-2"
            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            {[
              "Save your full analysis history permanently",
              "Access results from any device",
              "Free forever — no credit card needed",
            ].map((b) => (
              <div key={b} className="flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-xs" style={{ color: "var(--text-2)" }}>{b}</span>
              </div>
            ))}
          </div>
        )}

        <div className="card p-6">
          {/* Mode toggle */}
          <div
            className="flex rounded-lg p-0.5 mb-6"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError("") }}
                className="flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200"
                style={mode === m
                  ? { background: "var(--surface)", color: "var(--text)", boxShadow: "var(--shadow)" }
                  : { background: "transparent", color: "var(--text-3)" }
                }
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--text-2)" }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field p-3"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--text-2)" }}
              >
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field p-3"
                required
              />
            </div>

            {error && (
              <div
                className="flex items-start gap-2 text-sm rounded-xl px-4 py-3"
                style={{
                  color: "#ef4444",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)"
                }}
              >
                <svg className="shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full py-3 text-sm font-semibold mt-2"
            >
              {mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: "var(--text-3)" }}>
          No account required —{" "}
          <Link
            to="/"
            className="font-medium transition-colors underline underline-offset-4"
            style={{ color: "var(--text-2)" }}
          >
            Continue as Guest
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
