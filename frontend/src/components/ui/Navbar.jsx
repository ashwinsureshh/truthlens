import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useTheme } from "../../App"
import { motion, AnimatePresence } from "framer-motion"

export default function Navbar() {
  const token = localStorage.getItem("token")
  const location = useLocation()
  const { dark, toggle } = useTheme()
  const isActive = (path) => location.pathname === path
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <nav
        className="fixed top-0 w-full z-50 backdrop-blur-md border-b"
        style={{ background: "var(--nav-bg)", borderColor: "var(--border)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" onClick={closeMenu} className="flex items-center gap-2.5 group shrink-0">
            <TruthLensIcon dark={dark} className="w-8 h-8 transition-opacity duration-300 opacity-90 group-hover:opacity-100" />
            <span className="text-sm font-bold tracking-wide" style={{ color: "var(--text)" }}>
              TruthLens
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" label="Analyze" active={isActive("/")} />
            {token && <NavLink to="/history" label="History" active={isActive("/history")} />}
            <NavLink to="/trending" label="Trending" active={isActive("/trending")} />
            <NavLink to="/about" label="About" active={isActive("/about")} />
            <ThemeButton dark={dark} toggle={toggle} />
            {token ? (
              <button
                onClick={() => { localStorage.removeItem("token"); window.location.href = "/" }}
                className="ml-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200"
                style={{ color: "var(--text-3)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-2)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-3)"}
              >
                Logout
              </button>
            ) : (
              <Link to="/login" className="ml-1 btn-outline px-4 py-1.5 text-xs">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile right: theme + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeButton dark={dark} toggle={toggle} />
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ color: "var(--text-2)", background: menuOpen ? "var(--surface-2)" : "transparent" }}
              aria-label="Menu"
            >
              {menuOpen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M3 12h18M3 6h18M3 18h18"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed top-14 left-0 right-0 z-40 border-b px-4 py-3 space-y-1"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {[
              { to: "/", label: "Analyze" },
              { to: "/trending", label: "Trending" },
              { to: "/about", label: "About" },
              ...(token ? [{ to: "/history", label: "History" }] : []),
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={closeMenu}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={isActive(to)
                  ? { color: "var(--text)", background: "var(--surface-2)" }
                  : { color: "var(--text-2)" }
                }
              >
                {label}
              </Link>
            ))}
            <div className="pt-1 border-t" style={{ borderColor: "var(--border)" }}>
              {token ? (
                <button
                  onClick={() => { localStorage.removeItem("token"); window.location.href = "/"; closeMenu() }}
                  className="w-full text-left flex items-center px-3 py-2.5 rounded-lg text-sm font-medium"
                  style={{ color: "var(--text-3)" }}
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium"
                  style={{ color: "#6366f1" }}
                >
                  Sign In →
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ThemeButton({ dark, toggle }) {
  return (
    <button
      onClick={toggle}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200"
      style={{ color: "var(--text-2)", background: "transparent" }}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}

function TruthLensIcon({ dark, className = "" }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="20" cy="20" r="20" fill={dark ? "white" : "#0f172a"} />
      <circle cx="20" cy="20" r="19" fill={dark ? "black" : "#f8fafc"} />
      <path d="M14.5 14.5 A8 8 0 0 0 14.5 25.5"  stroke={dark ? "white" : "#0f172a"} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M11.5 11.5 A12 12 0 0 0 11.5 28.5" stroke={dark ? "white" : "#0f172a"} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M8.5 8.5  A16 16 0 0 0 8.5 31.5"  stroke={dark ? "white" : "#0f172a"} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M16 20 C18 15.5 26 15.5 30 20 C26 24.5 18 24.5 16 20 Z" fill={dark ? "white" : "#0f172a"} />
      <circle cx="25" cy="20" r="3.2" fill={dark ? "black" : "#f8fafc"} />
      <circle cx="26" cy="18.8" r="1.1" fill={dark ? "white" : "#0f172a"} />
    </svg>
  )
}

function NavLink({ to, label, active }) {
  return (
    <Link
      to={to}
      className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200"
      style={active
        ? { color: "var(--text)", background: "var(--surface-2)", border: "1px solid var(--border)" }
        : { color: "var(--text-2)", background: "transparent", border: "1px solid transparent" }
      }
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface-2)" } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.background = "transparent" } }}
    >
      {label}
    </Link>
  )
}
