import { Link, useLocation } from "react-router-dom"
import { useTheme } from "../../App"

export default function Navbar() {
  const token = localStorage.getItem("token")
  const location = useLocation()
  const { dark, toggle } = useTheme()
  const isActive = (path) => location.pathname === path

  return (
    <nav
      className="fixed top-0 w-full z-50 backdrop-blur-md border-b"
      style={{
        background: "var(--nav-bg)",
        borderColor: "var(--border)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <TruthLensIcon dark={dark} className="w-8 h-8 transition-opacity duration-300 opacity-90 group-hover:opacity-100" />
          <span className="text-sm font-bold tracking-wide" style={{ color: "var(--text)" }}>
            TruthLens
          </span>
        </Link>

        {/* Nav links + controls */}
        <div className="flex items-center gap-1">
          <NavLink to="/" label="Analyze" active={isActive("/")} />
          {token && <NavLink to="/history" label="History" active={isActive("/history")} />}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="ml-1 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200"
            style={{
              color: "var(--text-2)",
              background: "transparent",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? (
              /* Sun icon */
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              /* Moon icon */
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

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
            <Link
              to="/login"
              className="ml-1 btn-outline px-4 py-1.5 text-xs"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
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
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--text)"
          e.currentTarget.style.background = "var(--surface-2)"
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--text-2)"
          e.currentTarget.style.background = "transparent"
        }
      }}
    >
      {label}
    </Link>
  )
}
