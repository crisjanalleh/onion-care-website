import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const libraryIndex = readFileSync(
  new URL("../src/routes/_authed/_farmer/library.index.jsx", import.meta.url),
  "utf8",
);
const diseaseRoute = readFileSync(
  new URL("../src/routes/_authed/_farmer/library.diseases.index.jsx", import.meta.url),
  "utf8",
);
const diseaseDetailRoute = readFileSync(
  new URL("../src/routes/_authed/_farmer/library.diseases.$diseaseId.jsx", import.meta.url),
  "utf8",
);
const pestRoute = readFileSync(
  new URL("../src/routes/_authed/_farmer/library.pests.index.jsx", import.meta.url),
  "utf8",
);

test("library index links to canonical disease and pest routes", () => {
  assert.match(libraryIndex, /to="\/library\/diseases"/);
  assert.match(libraryIndex, /to="\/library\/pests"/);
  assert.doesNotMatch(libraryIndex, /to="\/_authed\//);
  assert.match(diseaseRoute, /createFileRoute\("\/_authed\/_farmer\/library\/diseases/);
  assert.match(diseaseDetailRoute, /createFileRoute\("\/_authed\/_farmer\/library\/diseases\/\$diseaseId"/);
  assert.match(pestRoute, /createFileRoute\("\/_authed\/_farmer\/library\/pests/);
});
