import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getAIExplanation, aiChat } from "../../services/api"

/**
 * AIExplanation
 * -------------
 * Auto-generates a plain-English "why" for the verdict on first mount,
 * plus a chat box where the user can ask follow-up questions.
 */
export default function AIExplanation({ analysisId }) {
  const [explanation, setExplanation] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const fetched = useRef(false)

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [history, setHistory] = useState([])     // [{role, content}]
  const [input, setInput] = useState("")
  const [chatBusy, setChatBusy] = useState(false)
  const [chatError, setChatError] = useState("")
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (!analysisId || fetched.current) return
    fetched.current = true
    getAIExplanation(analysisId)
      .then((res) => setExplanation(res.data.explanation || ""))
      .catch((err) => {
        const status = err.response?.status
        if (status === 503) setError("AI explanations not configured.")
        else setError(err.response?.data?.error || "AI explanation unavailable.")
      })
      .finally(() => setLoading(false))
  }, [analysisId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [history, chatBusy])

  async function sendChat(e) {
    e?.preventDefault()
    const msg = input.trim()
    if (!msg || chatBusy) return
    setChatError("")
    const newHistory = [...history, { role: "user", content: msg }]
    setHistory(newHistory)
    setInput("")
    setChatBusy(true)
    try {
      const res = await aiChat(analysisId, msg, history)
      setHistory([...newHistory, { role: "assistant", content: res.data.reply }])
    } catch (err) {
      setChatError(err.response?.data?.error || "Chat failed. Try again.")
    } finally {
      setChatBusy(false)
    }
  }

  if (error) return null   // fail silently — don't break Results page

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #6366f1, #ec4899)",
              boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 2l2.4 6.4L21 11l-6.6 2.6L12 20l-2.4-6.4L3 11l6.6-2.6L12 2z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              AI Explanation
            </h3>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
              Powered by Gemini · plain-English summary of the verdict
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-2">
            <span className="dot-bounce w-1.5 h-1.5 rounded-full" style={{ background: "#6366f1" }} />
            <span className="dot-bounce w-1.5 h-1.5 rounded-full" style={{ background: "#6366f1" }} />
            <span className="dot-bounce w-1.5 h-1.5 rounded-full" style={{ background: "#6366f1" }} />
            <span className="text-xs" style={{ color: "var(--text-3)" }}>Generating explanation…</span>
          </div>
        ) : (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-2)" }}
          >
            {explanation}
          </motion.p>
        )}

        {!loading && (
          <button
            type="button"
            onClick={() => setChatOpen((v) => !v)}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            style={{
              color: "#6366f1",
              border: "1px solid rgba(99,102,241,0.3)",
              background: "rgba(99,102,241,0.06)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            {chatOpen ? "Hide chat" : "Ask a question about this article"}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {chatOpen && (
          <motion.div
            key="chat"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t"
            style={{ borderColor: "var(--border)", overflow: "hidden" }}
          >
            <div className="p-4 max-h-72 overflow-y-auto space-y-3">
              {history.length === 0 && (
                <div className="text-xs" style={{ color: "var(--text-3)" }}>
                  Try: <em>“What's the strongest evidence in this article?”</em> or
                  <em> “Where might this be biased?”</em>
                </div>
              )}
              {history.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[80%] px-3 py-2 rounded-lg text-sm leading-relaxed"
                    style={{
                      background: m.role === "user"
                        ? "rgba(99,102,241,0.12)"
                        : "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {chatBusy && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-lg flex gap-1.5"
                       style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <span className="dot-bounce w-1 h-1 rounded-full" style={{ background: "var(--text-3)" }} />
                    <span className="dot-bounce w-1 h-1 rounded-full" style={{ background: "var(--text-3)" }} />
                    <span className="dot-bounce w-1 h-1 rounded-full" style={{ background: "var(--text-3)" }} />
                  </div>
                </div>
              )}
              {chatError && (
                <div className="text-xs" style={{ color: "#ef4444" }}>{chatError}</div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendChat} className="p-3 border-t flex gap-2"
                  style={{ borderColor: "var(--border)" }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about this article…"
                disabled={chatBusy}
                maxLength={1000}
                className="flex-1 text-sm px-3 py-2 rounded-md outline-none"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              />
              <button
                type="submit"
                disabled={chatBusy || !input.trim()}
                className="px-3 py-2 rounded-md text-sm font-medium transition-opacity disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "white",
                }}
              >
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
