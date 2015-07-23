// Create string id generating function.
export default function stringId() {
  const base = Math.random().toString(36).slice(2);
  let id = 0;

  return () => base + id++;
}
