import { Colors } from '@/src/constants/colors';

/**
 * Theme cho TaskDetail — đồng nhất với Tasks screen.
 * Map sang Colors token của Mangaka Design System.
 */
export const C = {
  bg:             Colors.bg,               // #222831
  surface:        Colors.surface,          // #393E46
  surfaceHigh:    Colors.surfaceContainer, // #4a4f58
  surfaceHighest: 'rgba(255,255,255,0.1)', // overlay nhẹ

  border:         Colors.borderSubtle,     // rgba(255,255,255,0.05)
  borderFaint:    Colors.borderFaint,      // rgba(255,255,255,0.1)

  text:           Colors.text,             // #EDF1FB
  textMuted:      Colors.textMuted,        // rgba(237,241,251,0.6)
  textFaint:      Colors.textFaint,        // rgba(237,241,251,0.4)

  accent:         Colors.accent,           // #FFD369
  accentDim:      Colors.accent,

  statusReview:   Colors.statusReview,     // #FFB84D
  statusDone:     Colors.statusDone,       // #5DD39E

  error:          '#ba1a1a',
  onError:        '#ffffff',
} as const;
