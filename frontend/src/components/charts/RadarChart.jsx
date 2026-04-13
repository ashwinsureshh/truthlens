import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts"

export default function RadarChart({ scores }) {
  const data = [
    { axis: "Sensationalism", value: scores?.sensationalism ?? 0 },
    { axis: "Bias",           value: scores?.bias           ?? 0 },
    { axis: "Emotion",        value: scores?.emotion        ?? 0 },
    { axis: "Factual",        value: scores?.factual        ?? 0 },
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsRadar data={data} cx="50%" cy="50%" outerRadius="68%">
        <PolarGrid stroke="rgba(255,255,255,0.06)" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }}
        />
        <Radar
          name="score"
          dataKey="value"
          stroke="rgba(255,255,255,0.6)"
          fill="rgba(255,255,255,0.05)"
          fillOpacity={1}
          strokeWidth={1.5}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  )
}
