import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts"

export default function RadarChart({ scores }) {
  const data = [
    { axis: "Sensationalism", value: scores.sensationalism ?? 0 },
    { axis: "Bias",           value: scores.bias           ?? 0 },
    { axis: "Emotion",        value: scores.emotion        ?? 0 },
    { axis: "Factual",        value: scores.factual        ?? 0 },
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsRadar data={data} cx="50%" cy="50%" outerRadius="68%">
        <PolarGrid stroke="rgba(6,182,212,0.1)" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: "#475569", fontSize: 11, fontFamily: "Inter, system-ui" }}
        />
        <Radar
          name="score"
          dataKey="value"
          stroke="#06b6d4"
          fill="#06b6d4"
          fillOpacity={0.12}
          strokeWidth={1.5}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  )
}
