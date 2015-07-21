// Create string id generating function.
export default function (id=0) {
  const base = Math.random().toString(36).slice(2);

  return () => base + id++;
}
