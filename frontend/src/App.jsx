import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Home from "./pages/Home"
import Results from "./pages/Results"
import History from "./pages/History"
import Login from "./pages/Login"
import Navbar from "./components/ui/Navbar"
import WavesBackground from "./components/ui/WavesBackground"

export default function App() {
  return (
    <BrowserRouter>
      {/* Global animated background — persists across all pages */}
      <WavesBackground />

      {/* Gradient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/[0.06] blur-[150px]" />
        <div className="absolute bottom-[-80px] right-[8%] w-[400px] h-[400px] rounded-full bg-purple-500/[0.06] blur-[130px]" />
        <div className="absolute top-[40%] left-[5%] w-[340px] h-[340px] rounded-full bg-cyan-400/[0.04] blur-[110px]" />
      </div>

      <div className="relative z-10">
        <Navbar />
        <main className="min-h-screen pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/results/:id" element={<Results />} />
            <Route path="/history" element={<History />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
