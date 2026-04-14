import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Dot,
} from "recharts"

function CustomDot({ cx, cy, payload }) {
  const pct   = payload?.score ?? 0
  const color = pct < 45 ? "#10b981" : pct < 62 ? "#f59e0b" : "#ef4444"
  return (
    <circle
      cx={cx}
      cy={cy}
      r={pct >= 62 ? 6 : pct >= 45 ? 5 : 4}
      fill={color}
      stroke="var(--surface)"
      strokeWidth={2}
    />
  )
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d     = payload[0].payload
  const pct   = d.score ?? 0
  const color = pct < 45 ? "#10b981" : pct < 62 ? "#f59e0b" : "#ef4444"
  const label = pct < 45 ? "Credible" : pct < 62 ? "Uncertain" : "Suspicious"

  return (
    <div
      className="rounded-xl px-3 py-2.5 max-w-xs text-xs shadow-lg"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        color: "var(--text-2)",
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="font-bold font-mono text-sm" style={{ color }}>{pct.toFixed(0)}</span>
        <span
          className="px-1.5 py-0.5 rounded-md text-xs font-medium"
          style={{
            background: `${color}20`,
            color,
          }}
        >
          {label}
        </span>
        <span className="ml-auto" style={{ color: "var(--text-3)" }}>S{d.index}</span>
      </div>
      <p className="leading-relaxed" style={{ color: "var(--text-3)" }}>
        {d.sentence?.length > 90 ? d.sentence.slice(0, 90) + "…" : d.sentence}
      </p>
    </div>
  )
}

export default function TrustWaveform({ sentences }) {
  if (!sentences?.length) return null

  const data = sentences.map((s, i) => ({
    index:    i + 1,
    score:    s.score ?? 0,
    sentence: s.sentence,
    label:    s.label,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          Trust score per sentence — spikes indicate red flags
        </p>
        <div className="flex items-center gap-4">
          {[
            { label: "Credible",   color: "#10b981" },
            { label: "Uncertain",  color: "#f59e0b" },
            { label: "Suspicious", color: "#ef4444" },
          ].map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />

          <XAxis
            dataKey="index"
            tick={{ fill: "var(--text-3)", fontSize: 10 }}
            label={{ value: "Sentence #", position: "insideBottom", offset: -2, fill: "var(--text-3)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "var(--text-3)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            ticks={[0, 25, 45, 62, 100]}
          />

          {/* Threshold reference lines */}
          <ReferenceLine
            y={45}
            stroke="rgba(245,158,11,0.4)"
            strokeDasharray="4 3"
            label={{ value: "Uncertain", position: "right", fill: "#f59e0b", fontSize: 9 }}
          />
          <ReferenceLine
            y={62}
            stroke="rgba(239,68,68,0.4)"
            strokeDasharray="4 3"
            label={{ value: "Suspicious", position: "right", fill: "#ef4444", fontSize: 9 }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Line
            type="monotone"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Sentence index guide */}
      <div
        className="rounded-xl p-3 grid gap-1.5"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        }}
      >
        {data.map((d) => {
          const color = d.score < 45 ? "#10b981" : d.score < 62 ? "#f59e0b" : "#ef4444"
          return (
            <div key={d.index} className="flex items-start gap-2">
              <span
                className="text-xs font-bold font-mono shrink-0 w-6 text-right"
                style={{ color }}
              >
                S{d.index}
              </span>
              <span className="text-xs leading-relaxed truncate" style={{ color: "var(--text-3)" }}>
                {d.sentence.slice(0, 60)}{d.sentence.length > 60 ? "…" : ""}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
