import axios from "axios"

// Use relative /api when no explicit URL set — works through nginx proxy
// This means the same build works locally, via tunnel, and on Vercel
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const analyzeText = (text) => api.post("/analyze/text", { text })
export const analyzeUrl = (url) => api.post("/analyze/url", { url })
export const getHistory = () => api.get("/history")
export const getAnalysis = (id) => api.get(`/analyze/${id}`)
export const getBenchmark = (id) => api.get(`/benchmark/${id}`)
export const login = (email, password) => api.post("/auth/login", { email, password })
export const register = (email, password) => api.post("/auth/register", { email, password })
export const getStats = () => api.get("/stats")
export const getTrending = () => api.get("/trending")

export default api
