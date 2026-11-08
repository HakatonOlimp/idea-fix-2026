// frontend/src/csvUtils.js
export function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
}

export async function loadCSV(path) {
  // path — это путь относительно public, например "/data.csv"
  const res = await fetch(path);
  if (!res.ok) throw new Error('CSV not found');
  const text = await res.text();
  return parseCSV(text);
}
