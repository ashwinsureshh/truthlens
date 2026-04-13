import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { login, register } from "../services/api"

export default function Login() {
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
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
      setError(err.response?.data?.error || "Something went wrong.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full bg-purple-500/[0.04] blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-slide-up">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/25 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-glow-pulse" />
            </div>
            <span className="text-xl font-bold gradient-text">TruthLens</span>
          </div>
          <p className="text-slate-600 text-sm">
            {mode === "login" ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        <div className="glass-card p-6 glow-cyan">
          {/* Mode toggle */}
          <div className="flex bg-black/30 rounded-xl p-1 mb-6 border border-white/[0.05]">
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError("") }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? "bg-cyan-500/[0.12] text-cyan-400 border border-cyan-500/20"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-600 uppercase tracking-wider">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-neon w-full rounded-xl p-3.5 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600 uppercase tracking-wider">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-neon w-full rounded-xl p-3.5 text-sm"
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 text-red-400 text-sm bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3">
                <span className="mt-px shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-neon w-full py-3 rounded-xl text-sm mt-2">
              {mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-700 text-xs mt-5">
          Analysis is available without an account.{" "}
          <Link to="/" className="text-cyan-600 hover:text-cyan-400 transition-colors">
            Continue as guest
          </Link>
        </p>
      </div>
    </div>
  )
}
