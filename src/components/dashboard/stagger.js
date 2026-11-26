// Entrance animation timing, shared by BOTH variants so neither gets a head start:
// every animated container spreads its items over the same total time.
export const STAGGER_TOTAL_SECONDS = 1.2;

export function staggerStep(itemCount) {
  return `${(STAGGER_TOTAL_SECONDS / Math.max(1, itemCount)).toFixed(4)}s`;
}
