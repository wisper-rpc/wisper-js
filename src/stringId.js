// Create string id generating function.
export default function(id=0) {
  return () => String(id++);
}
