// Ink-wash themed confetti celebration
import confetti from 'canvas-confetti'

const INK_COLORS = [
  '#C23A2B', // cinnabar red
  '#C9A84C', // gold
  '#4A7C6F', // verdant
  '#1A1A1A', // ink black
  '#6A4A7C', // purple ink
  '#8B4513', // brown ink
]

/**
 * Launch ink-wash themed confetti celebration.
 * @param {'light'|'medium'|'grand'} intensity
 */
export function celebrate(intensity = 'medium') {
  const duration = intensity === 'grand' ? 5000 : intensity === 'medium' ? 3000 : 1500
  const end = Date.now() + duration

  const frame = () => {
    // Left burst
    confetti({
      particleCount: intensity === 'grand' ? 5 : 2,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: INK_COLORS,
    })
    // Right burst
    confetti({
      particleCount: intensity === 'grand' ? 5 : 2,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: INK_COLORS,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  // Initial big burst
  confetti({
    particleCount: intensity === 'grand' ? 150 : intensity === 'medium' ? 80 : 40,
    spread: intensity === 'grand' ? 120 : 80,
    origin: { y: 0.5, x: 0.5 },
    colors: INK_COLORS,
    decay: 0.92,
    scalar: intensity === 'grand' ? 1.4 : 1,
  })

  // Follow-up bursts
  setTimeout(() => frame(), 200)
}

/**
 * Quick gold burst — used for step badge earn.
 */
export function goldSpark() {
  confetti({
    particleCount: 20,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#C9A84C', '#D4AF37', '#E8C547'],
    scalar: 0.8,
  })
}
