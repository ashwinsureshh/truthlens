import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { analyzeText, analyzeUrl } from "../services/api"

export default function Home() {
  const [mode, setMode] = useState("text") // "text" | "url"
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = mode === "text"
        ? await analyzeText(input)
        : await analyzeUrl(input)
      navigate(`/results/${res.data.analysis_id}`)
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-bold text-center mb-2">
        Is this article credible?
      </h1>
      <p className="text-center text-gray-400 mb-10">
        Paste an article or enter a URL for instant sentence-level credibility analysis.
      </p>

      {/* Mode toggle */}
      <div className="flex bg-gray-800 rounded-lg p-1 mb-6 w-fit mx-auto">
        {["text", "url"].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setInput("") }}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === m ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {m === "text" ? "Paste Text" : "Enter URL"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "text" ? (
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste article text here (minimum 50 characters)..."
            rows={10}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            required
          />
        ) : (
          <input
            type="url"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://example.com/article"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            required
          />
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>
    </div>
  )
}
