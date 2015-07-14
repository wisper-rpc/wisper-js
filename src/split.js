const isChar = /[a-z_0-9]/i;

export default function split(path) {
  let i = 0, n = path.length, ch = path[i];

  while (isChar.test(ch) && i < n) {
    ch = path[++i];
  }

  return [path.slice(0, i), path.slice(ch == '.' ? i+1 : i)];
}
