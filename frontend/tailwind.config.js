/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        credible: "#22c55e",
        uncertain: "#f59e0b",
        suspicious: "#ef4444",
      },
    },
  },
  plugins: [],
}

