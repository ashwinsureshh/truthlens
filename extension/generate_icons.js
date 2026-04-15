// Run with: node generate_icons.js
// Generates PNG icons from the TruthLens SVG logo
const { createCanvas } = require("canvas")
const fs = require("fs")

const sizes = [16, 48, 128]

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext("2d")
  const s = size / 40 // scale factor (base is 40x40)

  // Background circle (indigo)
  ctx.beginPath()
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2)
  ctx.fillStyle = "#6366f1"
  ctx.fill()

  // Inner circle (dark)
  ctx.beginPath()
  ctx.arc(size/2, size/2, size/2 - s*1, 0, Math.PI * 2)
  ctx.fillStyle = "#1e1b4b"
  ctx.fill()

  // Eye shape
  ctx.beginPath()
  ctx.moveTo(16*s, 20*s)
  ctx.bezierCurveTo(18*s, 15.5*s, 26*s, 15.5*s, 30*s, 20*s)
  ctx.bezierCurveTo(26*s, 24.5*s, 18*s, 24.5*s, 16*s, 20*s)
  ctx.fillStyle = "white"
  ctx.fill()

  // Pupil
  ctx.beginPath()
  ctx.arc(25*s, 20*s, 3.2*s, 0, Math.PI * 2)
  ctx.fillStyle = "#1e1b4b"
  ctx.fill()

  // Highlight
  ctx.beginPath()
  ctx.arc(26*s, 18.8*s, 1.1*s, 0, Math.PI * 2)
  ctx.fillStyle = "white"
  ctx.fill()

  return canvas.toBuffer("image/png")
}

sizes.forEach(size => {
  const buf = drawIcon(size)
  fs.writeFileSync(`icons/icon${size}.png`, buf)
  console.log(`Generated icon${size}.png`)
})
