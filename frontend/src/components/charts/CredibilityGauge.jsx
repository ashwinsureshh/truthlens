/**
 * Futuristic SVG credibility gauge (0 = credible, 100 = suspicious).
 */
export default function CredibilityGauge({ score }) {
  const isCredible  = score < 40
  const isUncertain = score >= 40 && score < 70

  const color = isCredible ? "#10b981" : isUncertain ? "#f59e0b" : "#ef4444"
  const glowId = "gauge-glow"

  const CX = 100, CY = 100, R = 78
  const arcLen = Math.PI * R  // half-circle arc length

  // needle: -90deg (left) through top to +90deg (right)
  const needleAngleDeg = -90 + (score / 100) * 180
  const needleRad = ((needleAngleDeg - 90) * Math.PI) / 180
  const needleX = CX + 60 * Math.cos(needleRad)
  const needleY = CY + 60 * Math.sin(needleRad)

  // tick marks at 0, 25, 50, 75, 100
  const ticks = [0, 25, 50, 75, 100].map((s) => {
    const rad = (((-90 + (s / 100) * 180) - 90) * Math.PI) / 180
    return {
      ox: CX + R * Math.cos(rad),
      oy: CY + R * Math.sin(rad),
      ix: CX + (R - 10) * Math.cos(rad),
      iy: CY + (R - 10) * Math.sin(rad),
    }
  })

  const label = isCredible ? "Credible" : isUncertain ? "Uncertain" : "Suspicious"

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 130" className="w-56">
        <defs>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#10b981" />
            <stop offset="50%"  stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Track background */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Faint full-range gradient hint */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.1"
        />

        {/* Active arc */}
        {score > 0 && (
          <path
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * arcLen} ${arcLen}`}
            filter={`url(#${glowId})`}
            opacity="0.88"
          />
        )}

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.ox} y1={t.oy}
            x2={t.ix} y2={t.iy}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ))}

        {/* Needle */}
        <line
          x1={CX} y1={CY}
          x2={needleX} y2={needleY}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          filter={`url(#${glowId})`}
          opacity="0.92"
        />

        {/* Hub */}
        <circle cx={CX} cy={CY} r="8" fill="#07101f" stroke={color} strokeWidth="2" />
        <circle cx={CX} cy={CY} r="3.5" fill={color} />

        {/* Score */}
        <text
          x={CX} y={CY + 30}
          textAnchor="middle"
          fill="white"
          fontSize="22"
          fontWeight="700"
          fontFamily="monospace"
        >
          {score}
        </text>
      </svg>

      <span className="text-sm font-semibold mt-1 tracking-wide" style={{ color }}>
        {label}
      </span>
    </div>
  )
}
