// Builds the production server: server/dist/index.js
//
// @budget-draft/shared is TypeScript source with no build of its own, so it is
// bundled in. Every npm package the server depends on stays external and is
// loaded from node_modules at runtime, as usual.
import { readFileSync } from "node:fs";
import { build } from "esbuild";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

const external = [];
for (const name of Object.keys(pkg.dependencies)) {
  if (name !== "@budget-draft/shared") {
    external.push(name);
  }
}

await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  external,
  sourcemap: true, // stack traces in Render's logs point at the .ts files
  logLevel: "info",
});
