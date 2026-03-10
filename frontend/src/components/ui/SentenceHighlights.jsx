import { useState } from "react"

const LABEL_STYLES = {
  credible: "bg-green-900/40 border-green-700 hover:bg-green-900/60",
  uncertain: "bg-yellow-900/40 border-yellow-700 hover:bg-yellow-900/60",
  suspicious: "bg-red-900/40 border-red-700 hover:bg-red-900/60",
}

const LABEL_BADGE = {
  credible: "bg-green-700 text-green-100",
  uncertain: "bg-yellow-700 text-yellow-100",
  suspicious: "bg-red-700 text-red-100",
}

export default function SentenceHighlights({ sentences }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="space-y-2">
      <div className="flex gap-4 mb-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"/> Credible</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"/> Uncertain</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"/> Suspicious</span>
      </div>
      {sentences.map((s, i) => (
        <div
          key={i}
          onClick={() => setExpanded(expanded === i ? null : i)}
          className={`border rounded-lg p-3 cursor-pointer transition-colors ${LABEL_STYLES[s.label]}`}
        >
          <div className="flex justify-between items-start gap-4">
            <p className="text-sm text-gray-200">{s.sentence}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${LABEL_BADGE[s.label]}`}>
              {s.score.toFixed(0)}
            </span>
          </div>
          {expanded === i && (
            <p className="mt-2 text-xs text-gray-400 border-t border-gray-700 pt-2">
              {s.explanation}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
