import { createContext, useContext, useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Home      from "./pages/Home"
import Results   from "./pages/Results"
import History   from "./pages/History"
import Login     from "./pages/Login"
import Benchmark from "./pages/Benchmark"
import Navbar    from "./components/ui/Navbar"

export const ThemeContext = createContext({ dark: true, toggle: () => {} })
export const useTheme = () => useContext(ThemeContext)

export default function App() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme")
    return saved !== "light"
  })

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [dark])

  function toggle() {
    setDark((d) => !d)
  }

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      <BrowserRouter>
        <div
          className="transition-colors duration-300 min-h-screen"
          style={{ background: "var(--bg)" }}
        >
          <Navbar />
          <main className="min-h-screen pt-14">
            <Routes>
              <Route path="/"              element={<Home />} />
              <Route path="/results/:id"  element={<Results />} />
              <Route path="/history"      element={<History />} />
              <Route path="/login"        element={<Login />} />
              <Route path="/benchmark/:id" element={<Benchmark />} />
              <Route path="*"             element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeContext.Provider>
  )
}
