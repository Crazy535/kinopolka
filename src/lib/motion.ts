import type { Variants } from 'framer-motion'

export const EXPO_OUT: [number, number, number, number] = [0.19, 1, 0.22, 1]
export const EASE_OUT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

export const duration = {
  fast: 0.15,
  base: 0.25,
  slow: 0.45,
  reveal: 0.65,
} as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EXPO_OUT },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
}

export const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: EXPO_OUT },
  },
}
