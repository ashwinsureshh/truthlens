import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getAnalysis } from "../services/api"
import RadarChart from "../components/charts/RadarChart"
import CredibilityGauge from "../components/charts/CredibilityGauge"
import SentenceHighlights from "../components/ui/SentenceHighlights"

export default function Results() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    getAnalysis(id)
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load analysis."))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-40 text-gray-400">Loading results...</div>
  if (error) return <div className="text-center py-40 text-red-400">{error}</div>

  const { overall_score, scores, sentence_results } = data

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <h2 className="text-2xl font-bold text-center">Analysis Results</h2>

      {/* Score overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl p-6 flex flex-col items-center">
          <h3 className="text-sm text-gray-400 mb-4 uppercase tracking-wide">Overall Credibility</h3>
          <CredibilityGauge score={overall_score} />
        </div>
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="text-sm text-gray-400 mb-4 uppercase tracking-wide">Dimension Breakdown</h3>
          <RadarChart scores={scores} />
        </div>
      </div>

      {/* Sentence highlights */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h3 className="text-sm text-gray-400 mb-4 uppercase tracking-wide">Sentence Analysis</h3>
        <SentenceHighlights sentences={sentence_results} />
      </div>
    </div>
  )
}
