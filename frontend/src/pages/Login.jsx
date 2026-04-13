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
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-5 h-5 border border-white/30 rounded-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            <span className="font-terminal text-sm tracking-[0.2em] uppercase text-white">TruthLens</span>
          </div>
          <p className="font-terminal text-[10px] text-white/20 tracking-[0.2em] uppercase">
            {mode === "login" ? "> AUTHENTICATE TO CONTINUE" : "> CREATE NEW IDENTITY"}
          </p>
        </div>

        <div className="spotlight-card p-6 border-beam">
          {/* Mode toggle */}
          <div className="flex bg-white/[0.03] rounded-sm p-0.5 mb-6 border border-white/[0.06]">
            {["login", "register"].map((m) => (
              <button key={m}
                onClick={() => { setMode(m); setError("") }}
                className={`flex-1 py-2 rounded-sm text-[10px] font-terminal tracking-[0.2em] uppercase transition-all duration-200 ${
                  mode === m ? "bg-white text-black font-bold" : "text-white/25 hover:text-white/60"
                }`}
              >
                {m === "login" ? "SIGN IN" : "REGISTER"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-terminal text-[9px] text-white/20 uppercase tracking-[0.2em]">
                // EMAIL
              </label>
              <input
                type="email"
                placeholder="> user@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-mono w-full rounded-sm p-3.5 text-[11px]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-terminal text-[9px] text-white/20 uppercase tracking-[0.2em]">
                // PASSWORD
              </label>
              <input
                type="password"
                placeholder="> ••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-mono w-full rounded-sm p-3.5 text-[11px]"
                required
              />
            </div>

            {error && (
              <div className="font-terminal text-[10px] text-white/50 bg-white/[0.03] border border-white/[0.1] rounded-sm px-4 py-3">
                ! ERR :: {error}
              </div>
            )}

            <button type="submit"
              className="btn-primary w-full py-3 rounded-sm text-[11px] font-terminal tracking-[0.2em] uppercase mt-2"
            >
              {mode === "login" ? "AUTHENTICATE →" : "CREATE ACCOUNT →"}
            </button>
          </form>
        </div>

        <p className="text-center font-terminal text-[10px] text-white/15 mt-5 tracking-widest">
          NO ACCOUNT REQUIRED //{" "}
          <Link to="/" className="text-white/35 hover:text-white/70 transition-colors underline underline-offset-4">
            CONTINUE AS GUEST
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
