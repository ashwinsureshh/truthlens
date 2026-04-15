const LOADING_STEPS = ["Fetching content", "Parsing sentences", "Analyzing with AI", "Computing scores"]
const DIM_LABELS = { sensationalism: "Sensationalism", bias: "Bias", emotion: "Emotion", factual: "Fact Risk" }

let currentAnalysisId = null
let currentTab = "url"
let selectedText = ""

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  // Get current tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const urlEl = document.getElementById("currentUrl")
  if (tab?.url) {
    urlEl.textContent = tab.url.replace(/^https?:\/\//, "").slice(0, 55) + (tab.url.length > 60 ? "…" : "")
  }

  // Get selected text from content script
  refreshSelection()

  // Tab switching
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"))
      btn.classList.add("active")
      currentTab = btn.dataset.tab
      document.getElementById("urlMode").classList.toggle("hidden", currentTab !== "url")
      document.getElementById("textMode").classList.toggle("hidden", currentTab !== "text")
    })
  })

  // Buttons
  document.getElementById("analyzeUrlBtn").addEventListener("click", () => analyzeUrl(tab?.url))
  document.getElementById("analyzeTextBtn").addEventListener("click", () => analyzeText(selectedText))
  document.getElementById("refreshSelectionBtn").addEventListener("click", refreshSelection)
  document.getElementById("retryBtn").addEventListener("click", reset)
  document.getElementById("analyzeAgainBtn").addEventListener("click", reset)
  document.getElementById("settingsBtn").addEventListener("click", () => showView("settings"))
  document.getElementById("backBtn").addEventListener("click", () => showView("main"))
  document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings)
  document.getElementById("viewFullBtn").addEventListener("click", () => {
    if (currentAnalysisId) {
      chrome.tabs.create({ url: `${getApiBase().replace("/api", "")}/results/${currentAnalysisId}` })
    }
  })

  // Load saved API URL into settings
  const { apiUrl } = await chrome.storage.local.get("apiUrl")
  if (apiUrl) document.getElementById("apiUrlInput").value = apiUrl
})

// ── Get API base ──────────────────────────────────────────────────────────────
async function getApiBase() {
  const { apiUrl } = await chrome.storage.local.get("apiUrl")
  return (apiUrl || "http://localhost").replace(/\/$/, "") + "/api"
}

// ── Refresh selected text ─────────────────────────────────────────────────────
async function refreshSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString().trim(),
    })
    selectedText = results?.[0]?.result || ""
    const preview = document.getElementById("selectedTextPreview")
    const analyzeBtn = document.getElementById("analyzeTextBtn")
    if (selectedText && selectedText.length >= 20) {
      preview.textContent = selectedText.slice(0, 120) + (selectedText.length > 120 ? "…" : "")
      preview.classList.add("has-text")
      analyzeBtn.disabled = false
    } else {
      preview.textContent = selectedText ? "Selection too short — select more text" : "Select text on the page, then click below"
      preview.classList.remove("has-text")
      analyzeBtn.disabled = true
    }
  } catch {
    document.getElementById("selectedTextPreview").textContent = "Could not access page text"
  }
}

// ── Analyze URL ───────────────────────────────────────────────────────────────
async function analyzeUrl(url) {
  if (!url || url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
    showError("Cannot analyze browser internal pages. Navigate to a website first.")
    return
  }
  showLoading()
  try {
    const base = await getApiBase()
    const res = await fetch(`${base}/analyze/url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Analysis failed")
    currentAnalysisId = data.analysis_id
    showResult(data)
  } catch (err) {
    const msg = err.message || ""
    if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed")) {
      showError("Cannot connect to TruthLens server. Check Settings and make sure your server is running.")
    } else if (msg.includes("scrape") || msg.includes("500")) {
      showError("This site blocks automated access. Try selecting the article text and using the Selected Text tab.")
    } else {
      showError(msg || "Analysis failed. Please try again.")
    }
  }
}

// ── Analyze Text ──────────────────────────────────────────────────────────────
async function analyzeText(text) {
  if (!text || text.length < 50) {
    showError("Please select more text (at least a few sentences) for accurate analysis.")
    return
  }
  showLoading()
  try {
    const base = await getApiBase()
    const res = await fetch(`${base}/analyze/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Analysis failed")
    currentAnalysisId = data.analysis_id
    showResult(data)
  } catch (err) {
    const msg = err.message || ""
    if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed")) {
      showError("Cannot connect to TruthLens server. Check Settings and make sure your server is running.")
    } else {
      showError(msg || "Analysis failed. Please try again.")
    }
  }
}

// ── Loading ───────────────────────────────────────────────────────────────────
function showLoading() {
  document.getElementById("urlMode").classList.add("hidden")
  document.getElementById("textMode").classList.add("hidden")
  document.getElementById("loadingState").classList.remove("hidden")
  document.getElementById("errorState").classList.add("hidden")
  document.getElementById("resultState").classList.add("hidden")

  let step = 0
  const stepEl = document.getElementById("loadingStep")
  const progressEl = document.getElementById("loadingProgress")
  stepEl.textContent = LOADING_STEPS[0]
  progressEl.style.width = "15%"

  const interval = setInterval(() => {
    step = Math.min(step + 1, LOADING_STEPS.length - 1)
    stepEl.textContent = LOADING_STEPS[step]
    progressEl.style.width = `${15 + (step / (LOADING_STEPS.length - 1)) * 75}%`
    if (step === LOADING_STEPS.length - 1) clearInterval(interval)
  }, 800)

  window._loadingInterval = interval
}

// ── Error ─────────────────────────────────────────────────────────────────────
function showError(msg) {
  clearInterval(window._loadingInterval)
  document.getElementById("loadingState").classList.add("hidden")
  document.getElementById("urlMode").classList.add("hidden")
  document.getElementById("textMode").classList.add("hidden")
  document.getElementById("resultState").classList.add("hidden")
  document.getElementById("errorState").classList.remove("hidden")
  document.getElementById("errorMsg").textContent = msg
}

// ── Result ────────────────────────────────────────────────────────────────────
function showResult(data) {
  clearInterval(window._loadingInterval)
  document.getElementById("loadingState").classList.add("hidden")
  document.getElementById("errorState").classList.add("hidden")
  document.getElementById("resultState").classList.remove("hidden")

  const score = data.overall_score ?? 0
  const isCredible  = score < 45
  const isUncertain = score >= 45 && score < 62
  const isSuspicious = score >= 62

  const color = isCredible ? "#10b981" : isUncertain ? "#f59e0b" : "#ef4444"
  const label = isCredible ? "Credible" : isUncertain ? "Uncertain" : "Suspicious"
  const badgeClass = isCredible ? "badge-credible" : isUncertain ? "badge-uncertain" : "badge-suspicious"

  // Animate gauge
  animateGauge(score, color)

  // Badge + info
  const badge = document.getElementById("verdictBadge")
  badge.textContent = label
  badge.className = `verdict-badge ${badgeClass}`

  const n = data.sentence_count ?? data.sentence_results?.length ?? 0
  document.getElementById("sentenceCount").textContent = `${n} sentence${n !== 1 ? "s" : ""} analyzed`

  const confLevel = data.confidence_level ?? (n >= 8 ? "high" : n >= 4 ? "medium" : "low")
  const confColor = confLevel === "high" ? "#10b981" : confLevel === "medium" ? "#f59e0b" : "#94a3b8"
  const confEl = document.getElementById("confidenceLevel")
  confEl.textContent = confLevel.charAt(0).toUpperCase() + confLevel.slice(1) + " Confidence"
  confEl.style.color = confColor

  // Verdict message
  const verdictMsg = document.getElementById("verdictMsg")
  const verdictData = {
    Credible:  { title: "✓ Content appears credible", desc: "Low bias, factual language, and minimal sensationalism detected.", bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.2)", titleColor: "#10b981" },
    Uncertain: { title: "⚠ Exercise caution", desc: "Mixed signals — cross-reference with trusted sources before sharing.", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)", titleColor: "#f59e0b" },
    Suspicious:{ title: "✕ High misinformation risk", desc: "Strong indicators of bias, emotional manipulation, or false claims.", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.2)", titleColor: "#ef4444" },
  }[label]
  verdictMsg.style.background = verdictData.bg
  verdictMsg.style.border = `1px solid ${verdictData.border}`
  verdictMsg.innerHTML = `<strong style="color:${verdictData.titleColor}">${verdictData.title}</strong><span style="color:#94a3b8;font-size:11px">${verdictData.desc}</span>`

  // Dimensions
  const dimList = document.getElementById("dimList")
  dimList.innerHTML = ""
  const scores = data.scores ?? {}
  Object.entries(scores).forEach(([key, val]) => {
    const v = val ?? 0
    const c = v < 25 ? "#10b981" : v < 50 ? "#f59e0b" : "#ef4444"
    const item = document.createElement("div")
    item.className = "dim-item"
    item.innerHTML = `
      <div class="dim-name">${DIM_LABELS[key] ?? key}</div>
      <div class="dim-bar-row">
        <div class="dim-bar-bg">
          <div class="dim-bar-fill" style="width:0%;background:${c}" data-val="${v}"></div>
        </div>
        <span class="dim-val" style="color:${c}">${Math.round(v)}</span>
      </div>`
    dimList.appendChild(item)
  })
  // Animate bars after paint
  setTimeout(() => {
    dimList.querySelectorAll(".dim-bar-fill").forEach(el => {
      el.style.width = el.dataset.val + "%"
    })
  }, 50)

  // Red flags
  const sentences = data.sentence_results ?? []
  const redFlags = [...sentences].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 2).filter(s => (s.score ?? 0) >= 45)
  const rfSection = document.getElementById("redFlagsSection")
  const rfList = document.getElementById("redFlagsList")
  if (redFlags.length > 0) {
    rfSection.classList.remove("hidden")
    rfList.innerHTML = ""
    redFlags.forEach(s => {
      const item = document.createElement("div")
      item.className = "red-flag-item"
      item.innerHTML = `
        <div class="red-flag-score">Score: ${(s.score ?? 0).toFixed(1)}</div>
        <div class="red-flag-text">"${s.sentence}"</div>`
      rfList.appendChild(item)
    })
  } else {
    rfSection.classList.add("hidden")
  }
}

// ── Gauge animation ───────────────────────────────────────────────────────────
function animateGauge(score, color) {
  const arc = 207.3 // 75% of circumference (2*pi*44*0.75)
  const gaugeArc = document.getElementById("gaugeArc")
  const gaugeScore = document.getElementById("gaugeScore")
  gaugeArc.style.stroke = color

  let current = 0
  const target = score
  const steps = 40
  const increment = target / steps

  const interval = setInterval(() => {
    current = Math.min(current + increment, target)
    const filled = (current / 100) * arc
    gaugeArc.setAttribute("stroke-dasharray", `${filled} 276.5`)
    gaugeScore.textContent = current.toFixed(1)
    gaugeScore.style.color = color
    if (current >= target) clearInterval(interval)
  }, 30)
}

// ── Reset ─────────────────────────────────────────────────────────────────────
function reset() {
  currentAnalysisId = null
  document.getElementById("errorState").classList.add("hidden")
  document.getElementById("resultState").classList.add("hidden")
  document.getElementById("loadingState").classList.add("hidden")
  if (currentTab === "url") {
    document.getElementById("urlMode").classList.remove("hidden")
    document.getElementById("textMode").classList.add("hidden")
  } else {
    document.getElementById("urlMode").classList.add("hidden")
    document.getElementById("textMode").classList.remove("hidden")
    refreshSelection()
  }
}

// ── Views ─────────────────────────────────────────────────────────────────────
function showView(view) {
  document.getElementById("mainView").classList.toggle("hidden", view !== "main")
  document.getElementById("settingsView").classList.toggle("hidden", view !== "settings")
}

// ── Settings ──────────────────────────────────────────────────────────────────
async function saveSettings() {
  const url = document.getElementById("apiUrlInput").value.trim()
  await chrome.storage.local.set({ apiUrl: url })
  const saved = document.getElementById("settingsSaved")
  saved.classList.remove("hidden")
  setTimeout(() => saved.classList.add("hidden"), 2000)
}
