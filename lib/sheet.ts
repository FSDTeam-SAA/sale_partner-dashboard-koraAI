// A small deterministic spreadsheet evaluator. Never evaluates JavaScript or remote formulas.
export function cellValue(
  cells: string[][],
  row: number,
  col: number,
  seen = new Set<string>(),
): string {
  const raw = cells[row]?.[col] || "";
  if (!raw.startsWith("=")) return raw;
  const key = `${row}:${col}`;
  if (seen.has(key)) return "#CYCLE";
  const visited = new Set(seen).add(key);
  const reference = (ref: string) => {
    const match = /^([A-Z]+)([1-9]\d*)$/.exec(ref);
    if (!match) throw Error();
    let column = 0;
    for (const c of match[1]) column = column * 26 + c.charCodeAt(0) - 64;
    const value = cellValue(cells, Number(match[2]) - 1, column - 1, visited);
    if (value.startsWith("#")) throw Error(value);
    return Number(value) || 0;
  };
  try {
    let formula = raw
      .slice(1)
      .toUpperCase()
      .replace(
        /SUM\(([A-Z]+[1-9]\d*):([A-Z]+[1-9]\d*)\)/g,
        (_, start: string, end: string) => {
          const a = /([A-Z]+)(\d+)/.exec(start)!,
            b = /([A-Z]+)(\d+)/.exec(end)!;
          if (a[1].length !== 1 || b[1].length !== 1) throw Error();
          let sum = 0;
          if (Number(b[2]) - Number(a[2]) > 1000) throw Error();
          for (let r = Number(a[2]); r <= Number(b[2]); r++)
            for (let c = a[1].charCodeAt(0); c <= b[1].charCodeAt(0); c++)
              sum += reference(String.fromCharCode(c) + r);
          return String(sum);
        },
      );
    formula = formula
      .replace(/[A-Z]+[1-9]\d*/g, (ref) => `(${reference(ref)})`)
      .replace(/\s/g, "");
    const tokens = formula.match(/\d*\.?\d+|[()+*/-]/g) || [];
    if (tokens.join("") !== formula) throw Error();
    let pos = 0;
    const atom = (): number => {
      const t = tokens[pos++];
      if (t === "(") {
        const value = expression();
        if (tokens[pos++] !== ")") throw Error();
        return value;
      }
      if (t === "-") return -atom();
      if (t === "+") return atom();
      const n = Number(t);
      if (t === undefined || !Number.isFinite(n)) throw Error();
      return n;
    };
    const product = (): number => {
      let n = atom();
      while (tokens[pos] === "*" || tokens[pos] === "/") {
        const op = tokens[pos++],
          next = atom();
        n = op === "*" ? n * next : n / next;
      }
      return n;
    };
    const expression = (): number => {
      let n = product();
      while (tokens[pos] === "+" || tokens[pos] === "-") {
        const op = tokens[pos++],
          next = product();
        n = op === "+" ? n + next : n - next;
      }
      return n;
    };
    const n = expression();
    if (pos !== tokens.length || !Number.isFinite(n)) throw Error();
    return String(Math.round(n * 1e8) / 1e8);
  } catch (e) {
    return e instanceof Error && e.message === "#CYCLE" ? "#CYCLE" : "#ERROR";
  }
}
