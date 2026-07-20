/** Derive a human-readable Brief ID from a canonical scope hash. */
export function shortIdFromHash(canonicalHash: string): string {
  const hex = canonicalHash.replace(/^sha256:/, "");
  if (hex.length < 16) return "BD-0000-0000";
  return `BD-${hex.slice(0, 4).toUpperCase()}-${hex.slice(4, 8).toUpperCase()}`;
}
