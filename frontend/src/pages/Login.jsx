import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login, register } from "../services/api"

export default function Login() {
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
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
      setError(err.response?.data?.error || "Something went wrong.")
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <h2 className="text-2xl font-bold mb-8 text-center">
        {mode === "login" ? "Sign In" : "Create Account"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
          required
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {mode === "login" ? "Sign In" : "Register"}
        </button>
      </form>
      <p className="text-center text-gray-400 text-sm mt-6">
        {mode === "login" ? "No account?" : "Already have an account?"}{" "}
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="text-blue-400 hover:underline"
        >
          {mode === "login" ? "Register" : "Sign In"}
        </button>
      </p>
    </div>
  )
}
