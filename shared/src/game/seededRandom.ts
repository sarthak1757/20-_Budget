// Repeatable random numbers. The same seed always gives the same sequence,
// which is what makes the Daily Challenge identical for everyone and lets
// tests and bot simulations replay exactly.
//
// This is "mulberry32", a small, well-known generator. The bit operations
// look cryptic, but all they do is scramble a 32-bit number thoroughly on
// each call. It is NOT secure (anyone can predict it), only repeatable.
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0; // keep it a 32-bit unsigned integer
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const result = (t ^ (t >>> 14)) >>> 0;
    return result / 4294967296; // 2^32, so the result is in [0, 1)
  };
}

// Turns any text (like "2026-11-18") into a 32-bit seed (FNV-1a hash).
export function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
