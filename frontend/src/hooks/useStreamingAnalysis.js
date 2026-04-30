import { useCallback, useRef, useState } from "react"

/**
 * useStreamingAnalysis
 * --------------------
 * Hook to consume the SSE stream from /api/analyze/{text,url}/stream.
 *
 * Flask endpoints stream events with `data: {...json...}\n\n` framing.
 * Browsers' EventSource API does NOT support POST, so we use fetch +
 * ReadableStream and parse SSE manually.
 *
 * Events emitted by backend (see analyzer.analyze_text_stream):
 *   - {type:"meta", total_sentences, cached}
 *   - {type:"dimensions", scores:{sensationalism,bias,emotion,factual}}
 *   - {type:"sentence", index, text, score, dimensions}
 *   - {type:"complete", overall_score, scores, sentence_results, ...}
 *   - {type:"saved", analysis_id}
 *   - {type:"error", message}
 */
export function useStreamingAnalysis() {
  const [active, setActive]       = useState(false)
  const [meta, setMeta]           = useState(null)        // {total, cached}
  const [source, setSource]       = useState(null)        // domain credibility info
  const [dimensions, setDimensions] = useState(null)      // {sensationalism,bias,emotion,factual}
  const [sentences, setSentences] = useState([])          // accumulating sentence events
  const [progress, setProgress]   = useState(0)           // count scored
  const [final, setFinal]         = useState(null)        // {overall_score, scores, sentence_results,...}
  const [analysisId, setAnalysisId] = useState(null)
  const [error, setError]         = useState(null)
  const abortRef = useRef(null)

  const reset = useCallback(() => {
    setActive(false); setMeta(null); setSource(null); setDimensions(null)
    setSentences([]); setProgress(0); setFinal(null)
    setAnalysisId(null); setError(null)
  }, [])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setActive(false)
  }, [])

  const start = useCallback(async ({ mode, input }) => {
    reset()
    setActive(true)

    const controller = new AbortController()
    abortRef.current = controller

    const base = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api`
      : "/api"
    const url  = `${base}/analyze/${mode}/stream`
    const body = mode === "text" ? { text: input } : { url: input }
    const token = localStorage.getItem("token")

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        let msg = `Request failed (${res.status})`
        try {
          const j = await res.json()
          msg = j.error || msg
        } catch {}
        throw new Error(msg)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // SSE events split by blank line
        let idx
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 2)
          const line = raw.split("\n").find((l) => l.startsWith("data:"))
          if (!line) continue
          let evt
          try {
            evt = JSON.parse(line.slice(5).trim())
          } catch {
            continue
          }
          handleEvent(evt)
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Streaming failed")
      }
    } finally {
      setActive(false)
    }

    function handleEvent(evt) {
      switch (evt.type) {
        case "meta":
          setMeta({ total: evt.total_sentences, cached: !!evt.cached })
          break
        case "source":
          setSource(evt.source)
          break
        case "dimensions":
          setDimensions(evt.scores)
          break
        case "sentence":
          setSentences((prev) => {
            const next = [...prev]
            next[evt.index] = { text: evt.text, score: evt.score, dimensions: evt.dimensions }
            return next
          })
          setProgress((p) => p + 1)
          break
        case "complete":
          setFinal(evt)
          if (evt.scores) setDimensions(evt.scores)
          break
        case "saved":
          setAnalysisId(evt.analysis_id)
          break
        case "error":
          setError(evt.message || "Analysis error")
          break
        default:
          break
      }
    }
  }, [reset])

  return {
    active, meta, source, dimensions, sentences, progress,
    final, analysisId, error,
    start, cancel, reset,
  }
}
