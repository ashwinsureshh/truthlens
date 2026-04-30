import { motion } from "framer-motion"

/**
 * SourceBadge
 * -----------
 * Displays Media Bias/Fact Check ratings for known news domains.
 * Renders nothing for unknown domains.
 *
 * Props:
 *   source: {
 *     domain, name, known,
 *     trust, bias, factual,
 *     trust_display: { label, color, tier },
 *     bias_display:  { label, color },
 *   }
 */
export default function SourceBadge({ source }) {
  if (!source || !source.known) return null

  const trust = source.trust_display
  const bias  = source.bias_display

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap"
      style={{
        background: "var(--surface)",
        border: `1px solid ${trust?.color || "var(--border)"}40`,
        boxShadow: `0 0 0 1px ${trust?.color || "transparent"}1a inset`,
      }}
      title={`Source ratings sourced from Media Bias/Fact Check`}
    >
      {/* Source name + domain */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
          style={{
            background: `${trust?.color || "#6366f1"}1a`,
            color: trust?.color || "#6366f1",
          }}
        >
          {(source.name || source.domain || "?").slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
            {source.name || source.domain}
          </div>
          <div className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>
            {source.domain}
          </div>
        </div>
      </div>

      {/* Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {trust && (
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
            style={{
              background: `${trust.color}1a`,
              color: trust.color,
              border: `1px solid ${trust.color}55`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: trust.color }}
            />
            {trust.label}
          </span>
        )}
        {bias && (
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
            style={{
              background: `${bias.color}1a`,
              color: bias.color,
              border: `1px solid ${bias.color}55`,
            }}
          >
            {bias.label}
          </span>
        )}
        {source.factual && (
          <span
            className="text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-2)",
              border: "1px solid var(--border)",
            }}
            title="Factual reporting rating"
          >
            Factual: {source.factual.replace("_", " ")}
          </span>
        )}
      </div>
    </motion.div>
  )
}
