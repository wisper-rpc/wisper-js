const isChar = /[a-z_0-9]/i;

export default function split(path) {
  const n = path.length;
  let i = 0, ch = path[i];

  while (isChar.test(ch) && i < n) {
    ch = path[++i];
  }

  return [path.slice(0, i), path.slice(ch === '.' ? i + 1 : i)];
}
