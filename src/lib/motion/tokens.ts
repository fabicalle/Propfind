export const motionTokens = {
  duration: {
    normal: 250,
  },
  easing: {
    natural: [0.16, 1, 0.3, 1],
  },
  spring: {
    gentle: { type: 'spring', stiffness: 120, damping: 14 } as const,
    snappy: { type: 'spring', stiffness: 400, damping: 25 } as const,
  },
} as const;
