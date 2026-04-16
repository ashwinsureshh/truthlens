import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useTheme } from "../../App"
import { motion, AnimatePresence } from "framer-motion"

export default function Navbar() {
  const token = localStorage.getItem("token")
  const location = useLocation()
  const { dark, toggle } = useTheme()
  const isActive = (path) => location.pathname === path
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      {/* Floating pill nav — pointer-events-none on wrapper so content behind is clickable */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none" style={{ paddingTop: "12px", paddingLeft: "16px", paddingRight: "16px" }}>
        <motion.nav
          className="pointer-events-auto flex items-center h-12 px-4 gap-1"
          animate={{
            background: scrolled
              ? "rgba(5,5,8,0.92)"
              : "rgba(5,5,8,0.55)",
            borderColor: scrolled
              ? "rgba(255,255,255,0.1)"
              : "rgba(255,255,255,0.06)",
            boxShadow: scrolled
              ? "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)"
              : "none",
          }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            borderRadius: "100px",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            minWidth: "fit-content",
            width: "auto",
          }}
        >
          {/* Logo */}
          <Link to="/" onClick={closeMenu} className="flex items-center gap-2 mr-2 group shrink-0">
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <TruthLensIcon dark={dark} className="w-7 h-7" />
            </motion.div>
            <span className="text-sm font-bold tracking-tight hidden sm:block" style={{ color: "var(--text)" }}>
              TruthLens
            </span>
          </Link>

          {/* Divider */}
          <div className="hidden md:block w-px h-4 mx-2 shrink-0" style={{ background: "rgba(255,255,255,0.1)" }} />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            <NavLink to="/" label="Analyze" active={isActive("/")} />
            {token && <NavLink to="/history" label="History" active={isActive("/history")} />}
            <NavLink to="/trending" label="Trending" active={isActive("/trending")} />
            <NavLink to="/about" label="About" active={isActive("/about")} />
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-1 ml-2">
            <ThemeButton dark={dark} toggle={toggle} />
            {token ? (
              <motion.button
                onClick={() => { localStorage.removeItem("token"); window.location.href = "/" }}
                className="px-3 py-1.5 text-xs font-medium rounded-full"
                style={{ color: "var(--text-3)" }}
                whileHover={{ color: "var(--text-2)" }}
                whileTap={{ scale: 0.96 }}
              >
                Logout
              </motion.button>
            ) : (
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: "rgba(99,102,241,0.15)",
                    color: "#818cf8",
                    border: "1px solid rgba(99,102,241,0.25)",
                  }}
                >
                  Sign In
                </Link>
              </motion.div>
            )}
          </div>

          {/* Mobile: theme + hamburger */}
          <div className="flex md:hidden items-center gap-1 ml-2">
            <ThemeButton dark={dark} toggle={toggle} />
            <motion.button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{
                color: "var(--text-2)",
                background: menuOpen ? "rgba(255,255,255,0.08)" : "transparent",
              }}
              whileTap={{ scale: 0.9 }}
              aria-label="Menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {menuOpen ? (
                  <motion.svg key="x" initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.18 }}
                    width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </motion.svg>
                ) : (
                  <motion.svg key="menu" initial={{ rotate: 45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -45, opacity: 0 }} transition={{ duration: 0.18 }}
                    width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M3 12h18M3 6h18M3 18h18"/>
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.nav>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-16 left-4 right-4 z-40 rounded-2xl border p-3 space-y-1"
            style={{
              background: dark ? "rgba(22,22,36,0.98)" : "rgba(255,255,255,0.97)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-hover)",
            }}
          >
            {[
              { to: "/", label: "Analyze" },
              { to: "/trending", label: "Trending" },
              { to: "/about", label: "About" },
              ...(token ? [{ to: "/history", label: "History" }] : []),
            ].map(({ to, label }, i) => (
              <motion.div
                key={to}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
              >
                <Link
                  to={to}
                  onClick={closeMenu}
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={
                    isActive(to)
                      ? { color: "var(--text)", background: "var(--surface-2)" }
                      : { color: "var(--text-2)" }
                  }
                >
                  {label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18 }}
              className="pt-2 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              {token ? (
                <button
                  onClick={() => { localStorage.removeItem("token"); window.location.href = "/"; closeMenu() }}
                  className="w-full text-left flex items-center px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ color: "var(--text-3)" }}
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex items-center justify-center py-3 rounded-xl text-sm font-semibold"
                  style={{
                    background: "rgba(99,102,241,0.15)",
                    color: "#818cf8",
                    border: "1px solid rgba(99,102,241,0.2)",
                  }}
                >
                  Sign In →
                </Link>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ThemeButton({ dark, toggle }) {
  return (
    <motion.button
      onClick={toggle}
      className="w-8 h-8 flex items-center justify-center rounded-full"
      style={{ color: "var(--text-3)" }}
      whileHover={{ scale: 1.1, color: "var(--text-2)", background: "rgba(255,255,255,0.07)" }}
      whileTap={{ scale: 0.88, rotate: 20 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {dark ? (
          <motion.svg key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.22 }}
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </motion.svg>
        ) : (
          <motion.svg key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.22 }}
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
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
      className="relative px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-150"
      style={{ color: active ? "var(--text)" : "var(--text-3)" }}
    >
      {active && (
        <motion.div
          layoutId="nav-pill"
          className="absolute inset-0 rounded-full"
          style={{ background: "rgba(255,255,255,0.08)" }}
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <motion.span
        className="relative z-10 block"
        whileHover={!active ? { color: "var(--text-2)" } : {}}
      >
        {label}
      </motion.span>
    </Link>
  )
}
