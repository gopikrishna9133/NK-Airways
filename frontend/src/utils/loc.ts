export function normalizeLocation(input?: string) {
  if (!input) return "";
  input = input.trim();
  const match = input.match(/\(([A-Za-z0-9]{2,4})\)/);
  if (match && match[1]) return match[1].toUpperCase();

  if (/^[A-Za-z]{2,4}$/.test(input)) return input.toUpperCase();

  const tokens = input.split(/\s+/);
  const last = tokens[tokens.length - 1];
  if (/^[A-Za-z]{2,4}$/.test(last)) return last.toUpperCase();

  return input;
}
