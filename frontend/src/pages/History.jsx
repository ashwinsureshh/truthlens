import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getHistory } from "../services/api"

export default function History() {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHistory()
      .then((res) => setAnalyses(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-40 text-gray-400">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-8">Analysis History</h2>
      {analyses.length === 0 ? (
        <p className="text-gray-400">No analyses yet. <Link to="/" className="text-blue-400 underline">Analyze an article</Link></p>
      ) : (
        <div className="space-y-3">
          {analyses.map((a) => (
            <Link
              key={a.id}
              to={`/results/${a.id}`}
              className="block bg-gray-900 hover:bg-gray-800 rounded-lg p-4 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-400 uppercase">{a.input_type}</span>
                  <p className="text-sm text-gray-200 mt-1 truncate max-w-lg">
                    {a.source_url || "Text input"}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${
                    a.overall_score < 40 ? "text-green-400"
                    : a.overall_score < 70 ? "text-yellow-400"
                    : "text-red-400"
                  }`}>
                    {a.overall_score}
                  </span>
                  <p className="text-xs text-gray-500">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
