export function findValue(record: Record<string, any>, keysToSearch: string[]): string {
  if (!record) return "";

  // 1. Try exact match
  for (const k of keysToSearch) {
    if (record[k] !== undefined && record[k] !== null) {
      return String(record[k]).trim();
    }
  }

  // 2. Try matching normalized keys (lowercase, alphanumeric only)
  const normalizedSearch = keysToSearch.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const [key, val] of Object.entries(record)) {
    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalizedSearch.includes(normKey) && val !== undefined && val !== null) {
      return String(val).trim();
    }
  }

  // 3. Try matching keyword contains
  for (const k of keysToSearch) {
    const normSearch = k.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const [key, val] of Object.entries(record)) {
      const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normKey.includes(normSearch) && val !== undefined && val !== null) {
        return String(val).trim();
      }
    }
  }

  return "";
}
