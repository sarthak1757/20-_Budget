// The colour palette. index.css declares the same values as Tailwind theme
// tokens (bg-mocha, text-lavender, ...), which is what components use;
// palette.test.ts checks the two lists match. This file exists so the
// contrast of every pairing can be computed and tested, and shown on
// /style-guide.

export const PALETTE = {
  mocha: "#6F4E37", // page background
  "mocha-dark": "#4F3726", // cards, slots, header and footer bars
  "mocha-light": "#7E5D46", // hover surfaces, dividers
  lavender: "#E6E0F0", // headlines, primary text, primary button fill
  "lavender-deep": "#B8A9D9", // active player, current turn, urgency, highlights
  platinum: "#E5E4E2", // body text, borders, secondary buttons, rating bars
} as const;

export type PaletteName = keyof typeof PALETTE;

// Relative luminance, as defined by WCAG 2.
function luminance(hex: string): number {
  const channels: number[] = [];
  for (const start of [1, 3, 5]) {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    channels.push(value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  }
  const [r = 0, g = 0, b = 0] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: PaletteName, background: PaletteName): number {
  const a = luminance(PALETTE[foreground]);
  const b = luminance(PALETTE[background]);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// "AA" = any text size. "AA large" = only 24px+ (or 19px+ bold) text and
// non-text UI like borders and focus rings.
export type ContrastGrade = "AA" | "AA large" | "fail";

export function contrastGrade(ratio: number): ContrastGrade {
  if (ratio >= 4.5) {
    return "AA";
  }
  if (ratio >= 3) {
    return "AA large";
  }
  return "fail";
}

export interface ColourPairing {
  foreground: PaletteName;
  background: PaletteName;
  use: string; // where the design uses it
  needs: "AA" | "AA large";
}

// Every text/background pairing the design uses.
export const PAIRINGS: ColourPairing[] = [
  { foreground: "lavender", background: "mocha", use: "Headlines, primary text on the page", needs: "AA" },
  { foreground: "platinum", background: "mocha", use: "Body text and labels on the page", needs: "AA" },
  { foreground: "lavender", background: "mocha-dark", use: "Item names, budgets on cards", needs: "AA" },
  { foreground: "platinum", background: "mocha-dark", use: "Body text and labels on cards", needs: "AA" },
  { foreground: "lavender-deep", background: "mocha-dark", use: "Highlights and urgent text on cards", needs: "AA" },
  { foreground: "lavender-deep", background: "mocha", use: "Large serif highlights, frames, glows only", needs: "AA large" },
  { foreground: "lavender", background: "mocha-light", use: "Text on a hovered surface", needs: "AA" },
  { foreground: "platinum", background: "mocha-light", use: "Text on a hovered surface", needs: "AA" },
  { foreground: "mocha", background: "lavender", use: "Primary button label, price badge", needs: "AA" },
  { foreground: "mocha", background: "platinum", use: "Primary button label on hover", needs: "AA" },
  { foreground: "mocha-dark", background: "lavender-deep", use: "Text on a lavender-deep chip", needs: "AA" },
];
