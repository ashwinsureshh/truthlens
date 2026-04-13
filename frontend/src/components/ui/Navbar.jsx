import { Link, useLocation } from "react-router-dom"
import { motion } from "framer-motion"

export default function Navbar() {
  const token = localStorage.getItem("token")
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-white/[0.06]">
      {/* Top accent beam */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <motion.div
          className="h-full w-1/3"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)" }}
          animate={{ x: ["-100%", "400%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-6 h-6 border border-white/30 rounded-sm flex items-center justify-center group-hover:border-white/70 transition-all duration-300">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
          <span className="text-sm font-bold tracking-[0.15em] uppercase font-terminal text-white">
            Truth<span className="text-white/40">Lens</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <NavLink to="/" label="Analyze" active={isActive("/")} />
          {token && <NavLink to="/history" label="History" active={isActive("/history")} />}
          {token ? (
            <button
              onClick={() => { localStorage.removeItem("token"); window.location.href = "/" }}
              className="px-4 py-1.5 text-xs text-white/30 hover:text-white/70 transition-colors ml-1 font-terminal tracking-widest uppercase"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="ml-2 px-4 py-1.5 text-xs rounded btn-outline font-terminal tracking-widest uppercase"
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
      className={`px-4 py-1.5 text-xs rounded transition-all duration-200 font-terminal tracking-widest uppercase ${
        active
          ? "text-white bg-white/[0.07] border border-white/[0.15]"
          : "text-white/30 hover:text-white/70 hover:bg-white/[0.04]"
      }`}
    >
      {label}
    </Link>
  )
}
