import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
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

export default api
