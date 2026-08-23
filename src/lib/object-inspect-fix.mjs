// ESM shim for CommonJS object-inspect package
export default function inspect(obj, opts) {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj === 'string') return `"${obj}"`;
  if (typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'bigint') return String(obj);
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    try {
      return String(obj);
    } catch {
      return '[Object]';
    }
  }
}
export { inspect };
