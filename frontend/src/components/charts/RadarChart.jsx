import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts"

export default function RadarChart({ scores }) {
  const data = [
    { axis: "Sensationalism", value: scores.sensationalism ?? 0 },
    { axis: "Bias", value: scores.bias ?? 0 },
    { axis: "Emotion", value: scores.emotion ?? 0 },
    { axis: "Factual", value: scores.factual ?? 0 },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RechartsRadar data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: "#9ca3af", fontSize: 12 }} />
        <Radar name="score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
      </RechartsRadar>
    </ResponsiveContainer>
  )
}
