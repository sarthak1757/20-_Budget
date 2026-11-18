/// <reference types="node" />
// Node types only for this test: it reads index.css from disk (Vitest blanks CSS imports).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastGrade, contrastRatio, PAIRINGS, PALETTE, type PaletteName } from "./palette";

describe("palette contrast", () => {
  it("meets WCAG AA for every pairing the design uses", () => {
    for (const pairing of PAIRINGS) {
      const ratio = contrastRatio(pairing.foreground, pairing.background);
      const minimum = pairing.needs === "AA" ? 4.5 : 3;
      expect(ratio, `${pairing.foreground} on ${pairing.background}`).toBeGreaterThanOrEqual(minimum);
    }
  });

  it("grades known values like the WCAG calculator", () => {
    expect(contrastRatio("ivory", "ink")).toBeGreaterThan(15);
    expect(contrastGrade(contrastRatio("gold", "ink"))).toBe("AA");
    expect(contrastGrade(2)).toBe("fail");
  });
});

describe("theme tokens", () => {
  it("index.css declares exactly the palette's colours", () => {
    const css = readFileSync(join(import.meta.dirname, "..", "index.css"), "utf8");
    for (const name of Object.keys(PALETTE) as PaletteName[]) {
      expect(css).toContain(`--color-${name}: ${PALETTE[name]};`);
    }
  });
});
