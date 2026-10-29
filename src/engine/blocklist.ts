/**
 * Random filler letters should never spell out crude words. Only sequences made
 * entirely of filler cells are rerolled; hidden vocabulary is never touched.
 */
export const BLOCKED_SEQUENCES: readonly string[] = [
  'SHIT', 'FUCK', 'CUNT', 'DICK', 'COCK', 'PISS', 'TWAT', 'SLUT', 'WHORE', 'BITCH', 'RAPE',
];
