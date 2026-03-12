import { Link, useLocation } from "react-router-dom"

export default function Navbar() {
  const token = localStorage.getItem("token")
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-cyan-500/10">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/25 flex items-center justify-center group-hover:border-cyan-400/50 transition-all duration-300">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-glow-pulse" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="gradient-text">Truth</span>
            <span className="text-slate-300">Lens</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <NavLink to="/" label="Analyze" active={isActive("/")} />
          {token && <NavLink to="/history" label="History" active={isActive("/history")} />}
          {token ? (
            <button
              onClick={() => { localStorage.removeItem("token"); window.location.href = "/" }}
              className="px-4 py-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors ml-1"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="ml-2 px-4 py-1.5 text-sm rounded-lg btn-neon"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

function NavLink({ to, label, active }) {
  return (
    <Link
      to={to}
      className={`px-4 py-1.5 text-sm rounded-lg transition-all duration-200 ${
        active
          ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20"
          : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
      }`}
    >
      {label}
    </Link>
  )
}
