import { useRef, useId, useEffect } from 'react'
import { animate, useMotionValue } from 'framer-motion'

function mapRange(value, fromLow, fromHigh, toLow, toHigh) {
  if (fromLow === fromHigh) return toLow
  const pct = (value - fromLow) / (fromHigh - fromLow)
  return toLow + pct * (toHigh - toLow)
}

export function EtherealShadow({
  sizing    = 'fill',
  color     = 'rgba(180, 180, 180, 1)',
  animation = { scale: 100, speed: 90 },
  noise     = { opacity: 1, scale: 1.2 },
  className = '',
  style     = {},
}) {
  const rawId   = useId().replace(/:/g, '')
  const id      = `ethereal-${rawId}`

  const animationEnabled  = animation && animation.scale > 0
  const feColorMatrixRef  = useRef(null)
  const hueRotate         = useMotionValue(180)
  const animCtrlRef       = useRef(null)

  const displacementScale = animation ? mapRange(animation.scale, 1, 100, 20, 100)  : 0
  const animDuration      = animation ? mapRange(animation.speed, 1, 100, 1000, 50) : 1

  useEffect(() => {
    if (!feColorMatrixRef.current || !animationEnabled) return

    animCtrlRef.current?.stop()
    hueRotate.set(0)
    animCtrlRef.current = animate(hueRotate, 360, {
      duration:    animDuration / 25,
      repeat:      Infinity,
      repeatType:  'loop',
      ease:        'linear',
      onUpdate: (v) => {
        feColorMatrixRef.current?.setAttribute('values', String(v))
      },
    })

    return () => animCtrlRef.current?.stop()
  }, [animationEnabled, animDuration, hueRotate])

  return (
    <div
      className={className}
      style={{ overflow: 'hidden', position: 'relative', width: '100%', height: '100%', ...style }}
    >
      <div
        style={{
          position: 'absolute',
          inset:    -displacementScale,
          filter:   animationEnabled ? `url(#${id}) blur(6px)` : 'none',
        }}
      >
        {animationEnabled && (
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              <filter id={id}>
                <feTurbulence
                  result="undulation"
                  numOctaves="2"
                  baseFrequency={`${mapRange(animation.scale, 0, 100, 0.001, 0.0005)},${mapRange(animation.scale, 0, 100, 0.004, 0.002)}`}
                  seed="0"
                  type="turbulence"
                />
                <feColorMatrix
                  ref={feColorMatrixRef}
                  in="undulation"
                  type="hueRotate"
                  values="180"
                />
                <feColorMatrix
                  in="dist"
                  result="circulation"
                  type="matrix"
                  values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="circulation"
                  scale={displacementScale}
                  result="dist"
                />
                <feDisplacementMap
                  in="dist"
                  in2="undulation"
                  scale={displacementScale}
                  result="output"
                />
              </filter>
            </defs>
          </svg>
        )}

        {/* Shadow shape — uses the Framer mask image */}
        <div
          style={{
            backgroundColor: color,
            maskImage:        `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
            maskSize:         sizing === 'stretch' ? '100% 100%' : 'cover',
            maskRepeat:       'no-repeat',
            maskPosition:     'center',
            width:            '100%',
            height:           '100%',
            WebkitMaskImage:  `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
            WebkitMaskSize:   sizing === 'stretch' ? '100% 100%' : 'cover',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
          }}
        />
      </div>

      {/* Noise overlay */}
      {noise && noise.opacity > 0 && (
        <div
          style={{
            position:        'absolute',
            inset:           0,
            backgroundImage: `url("https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png")`,
            backgroundSize:  noise.scale * 200,
            backgroundRepeat:'repeat',
            opacity:         noise.opacity / 2,
            pointerEvents:   'none',
          }}
        />
      )}
    </div>
  )
}
