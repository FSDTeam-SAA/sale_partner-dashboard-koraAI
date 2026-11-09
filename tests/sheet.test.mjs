import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const compiled = ts.transpileModule(
  fs.readFileSync(new URL("../lib/sheet.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const evaluator = import(
  "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
);
test("spreadsheet arithmetic, references and SUM retain numeric semantics", async () => {
  const { cellValue } = await evaluator;
  const cells = [
    ["10", "20", "=A1+B1"],
    ["=C1*2", "=SUM(A1:B1)", "=2*(3+4)"],
  ];
  assert.equal(cellValue(cells, 0, 2), "30");
  assert.equal(cellValue(cells, 1, 0), "60");
  assert.equal(cellValue(cells, 1, 1), "30");
  assert.equal(cellValue(cells, 1, 2), "14");
});
test("cyclic, invalid and executable-looking formulas never execute code", async () => {
  const { cellValue } = await evaluator;
  assert.equal(cellValue([["=A1"]], 0, 0), "#CYCLE");
  assert.equal(cellValue([["=1/0"]], 0, 0), "#ERROR");
  assert.equal(cellValue([["=globalThis.process.exit()"]], 0, 0), "#ERROR");
  assert.equal(
    cellValue([['=HYPERLINK("https://example.invalid")']], 0, 0),
    "#ERROR",
  );
});
