/**
 * Simple SVG credibility gauge (0 = credible, 100 = suspicious).
 * Will be replaced with D3 animated version in Week 5.
 */
export default function CredibilityGauge({ score }) {
  const angle = -90 + (score / 100) * 180  // -90° to +90°
  const color = score < 40 ? "#22c55e" : score < 70 ? "#f59e0b" : "#ef4444"
  const label = score < 40 ? "Credible" : score < 70 ? "Uncertain" : "Suspicious"

  const toXY = (angleDeg, r) => {
    const rad = (angleDeg * Math.PI) / 180
    return [100 + r * Math.cos(rad), 100 + r * Math.sin(rad)]
  }

  const needleEnd = toXY(angle - 90, 55)

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-48">
        {/* Background arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#374151" strokeWidth="16" strokeLinecap="round" />
        {/* Colored arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="16"
          strokeLinecap="round" strokeDasharray={`${(score / 100) * 251.2} 251.2`} />
        {/* Needle */}
        <line x1="100" y1="100" x2={needleEnd[0]} y2={needleEnd[1]}
          stroke="white" strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="100" r="5" fill="white" />
        {/* Score text */}
        <text x="100" y="118" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{score}</text>
      </svg>
      <span style={{ color }} className="text-sm font-semibold mt-1">{label}</span>
    </div>
  )
}
