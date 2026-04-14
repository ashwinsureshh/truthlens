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
        <PolarGrid stroke="rgba(148,163,184,0.2)" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: "var(--text-3)", fontSize: 11, fontFamily: "Inter, system-ui, sans-serif" }}
        />
        <Radar
          name="score"
          dataKey="value"
          stroke="#6366f1"
          fill="rgba(99,102,241,0.15)"
          fillOpacity={1}
          strokeWidth={1.5}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  )
}
