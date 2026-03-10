import { Link } from "react-router-dom"

export default function Navbar() {
  const token = localStorage.getItem("token")

  return (
    <nav className="fixed top-0 w-full bg-gray-900 border-b border-gray-800 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-white tracking-tight">
          Truth<span className="text-blue-400">Lens</span>
        </Link>
        <div className="flex gap-6 text-sm text-gray-400">
          <Link to="/" className="hover:text-white transition-colors">Analyze</Link>
          {token && (
            <Link to="/history" className="hover:text-white transition-colors">History</Link>
          )}
          {token ? (
            <button
              onClick={() => { localStorage.removeItem("token"); window.location.href = "/" }}
              className="hover:text-white transition-colors"
            >
              Logout
            </button>
          ) : (
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
