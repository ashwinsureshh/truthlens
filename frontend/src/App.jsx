import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Home      from "./pages/Home"
import Results   from "./pages/Results"
import History   from "./pages/History"
import Login     from "./pages/Login"
import Benchmark from "./pages/Benchmark"
import Navbar    from "./components/ui/Navbar"
import { EtherealShadow } from "./components/ui/EtherealShadow"

export default function App() {
  return (
    <BrowserRouter>
      {/* Ethereal shadow background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <EtherealShadow
          color="rgba(160, 160, 160, 1)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 1, scale: 1.2 }}
          sizing="fill"
        />
      </div>

      <div className="relative z-10">
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
  )
}
