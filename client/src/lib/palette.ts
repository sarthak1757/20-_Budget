// The colour palette. index.css declares the same values as Tailwind theme
// tokens (bg-ink, text-ivory, ...), which is what components use;
// palette.test.ts checks the two lists match. This file exists so the
// contrast of every pairing can be computed and tested, and shown on
// /style-guide.

export const PALETTE = {
  ink: "#08090B", // page background (midnight black)
  "ink-raised": "#111317", // cards, slots, header and footer bars
  "ink-hover": "#1A1D22", // hover surfaces
  ivory: "#F5F3EF", // headlines and primary text (pure white, warm)
  gold: "#FFC900", // the accent: buttons, price badge, active player, highlights, urgency
  mist: "#C4C1BA", // body text, borders and rating bars (a softer ivory)
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
  { foreground: "ivory", background: "ink", use: "Headlines, primary text on the page", needs: "AA" },
  { foreground: "mist", background: "ink", use: "Body text and labels on the page", needs: "AA" },
  { foreground: "gold", background: "ink", use: "Accent text, icons and the urgent timer on the page", needs: "AA" },
  { foreground: "ivory", background: "ink-raised", use: "Item names, budgets on cards", needs: "AA" },
  { foreground: "mist", background: "ink-raised", use: "Body text and labels on cards", needs: "AA" },
  { foreground: "gold", background: "ink-raised", use: "Labels, badges and icons on cards", needs: "AA" },
  { foreground: "ivory", background: "ink-hover", use: "Text on a hovered surface", needs: "AA" },
  { foreground: "mist", background: "ink-hover", use: "Text on a hovered surface", needs: "AA" },
  { foreground: "ink", background: "gold", use: "Primary button label, price badge, selected chip", needs: "AA" },
  { foreground: "ink", background: "ivory", use: "Primary button label on hover", needs: "AA" },
];
