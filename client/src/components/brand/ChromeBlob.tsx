import { useId } from "react";

// Liquid-chrome shapes, drawn as SVG (original paths, no images).
// "Chrome" is faked with a gradient that has sharp bands of light and dark
// (that's what makes metal look like metal), a second curved reflection
// band, a soft specular highlight, and a blurred shadow underneath.
// Colours come from the theme tokens via CSS variables, never raw hex.

export type ChromeShape = "pebble" | "ring" | "ribbon";

interface ShapeDef {
  body: string; // the outline
  band: string; // a curved reflection band across the body
  highlight: { cx: number; cy: number; rx: number; ry: number; rotate: number };
  shadow: { cx: number; cy: number; rx: number; ry: number };
  evenOdd?: boolean; // the ring has a hole
}

const SHAPES: Record<ChromeShape, ShapeDef> = {
  pebble: {
    body: "M104 16 C150 10 190 48 186 98 C182 148 138 188 90 182 C44 176 12 138 18 92 C24 48 60 22 104 16 Z",
    band: "M30 118 C60 96 120 90 178 112 C176 126 170 138 162 150 C118 128 70 132 40 150 C34 140 31 129 30 118 Z",
    highlight: { cx: 78, cy: 52, rx: 34, ry: 14, rotate: -24 },
    shadow: { cx: 104, cy: 192, rx: 70, ry: 8 },
  },
  ring: {
    body:
      "M100 26 C152 26 184 60 184 100 C184 140 152 174 100 174 C48 174 16 140 16 100 C16 60 48 26 100 26 Z " +
      "M100 72 C80 72 66 84 66 100 C66 116 80 128 100 128 C120 128 134 116 134 100 C134 84 120 72 100 72 Z",
    band: "M24 112 C60 132 140 134 178 108 C176 124 168 138 156 150 C120 166 80 166 44 150 C34 140 27 127 24 112 Z",
    highlight: { cx: 70, cy: 48, rx: 30, ry: 10, rotate: -18 },
    shadow: { cx: 100, cy: 188, rx: 72, ry: 8 },
    evenOdd: true,
  },
  ribbon: {
    body: "M36 152 C14 112 46 66 92 78 C132 88 146 52 124 26 C166 34 192 78 170 122 C150 162 104 142 82 162 C70 174 52 176 36 152 Z",
    band: "M48 128 C70 104 104 112 128 104 C150 96 164 84 174 96 C168 114 152 126 130 130 C104 134 80 132 56 146 C52 140 49 134 48 128 Z",
    highlight: { cx: 140, cy: 48, rx: 18, ry: 8, rotate: 30 },
    shadow: { cx: 104, cy: 186, rx: 62, ry: 7 },
  },
};

interface ChromeBlobProps {
  shape?: ChromeShape;
  className?: string; // size and position, e.g. "w-64 absolute -top-10"
  float?: boolean; // slow floating motion (stops with reduced motion)
}

export function ChromeBlob({ shape = "pebble", className = "", float = true }: ChromeBlobProps) {
  // useId keeps gradient ids unique when several blobs are on one page.
  const id = useId().replace(/:/g, "");
  const def = SHAPES[shape];
  const fillRule = def.evenOdd === true ? "evenodd" : "nonzero";
  const floatClass = float ? (shape === "ring" ? "animate-float-slow" : "animate-float") : "";

  return (
    <svg viewBox="0 0 200 200" className={`${floatClass} ${className}`} aria-hidden focusable="false">
      <defs>
        {/* Sharp light/dark bands: the "metal" look. */}
        <linearGradient id={`${id}-body`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="var(--color-platinum)" />
          <stop offset="22%" stopColor="var(--color-lavender)" />
          <stop offset="40%" stopColor="var(--color-lavender-deep)" />
          <stop offset="48%" stopColor="var(--color-mocha-dark)" />
          <stop offset="58%" stopColor="var(--color-lavender-deep)" />
          <stop offset="74%" stopColor="var(--color-platinum)" />
          <stop offset="90%" stopColor="var(--color-mocha-light)" />
          <stop offset="100%" stopColor="var(--color-mocha-dark)" />
        </linearGradient>
        <linearGradient id={`${id}-band`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-mocha-dark)" stopOpacity="0.9" />
          <stop offset="35%" stopColor="var(--color-platinum)" stopOpacity="0.95" />
          <stop offset="60%" stopColor="var(--color-lavender)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="var(--color-mocha-dark)" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id={`${id}-glint`}>
          <stop offset="0%" stopColor="var(--color-platinum)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--color-platinum)" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
        <clipPath id={`${id}-clip`}>
          <path d={def.body} clipRule={fillRule} />
        </clipPath>
      </defs>

      <ellipse {...def.shadow} fill="var(--color-mocha-dark)" opacity="0.7" filter={`url(#${id}-blur)`} />
      <path d={def.body} fill={`url(#${id}-body)`} fillRule={fillRule} />
      <g clipPath={`url(#${id}-clip)`}>
        <path d={def.band} fill={`url(#${id}-band)`} filter={`url(#${id}-soft)`} />
        <ellipse
          cx={def.highlight.cx}
          cy={def.highlight.cy}
          rx={def.highlight.rx}
          ry={def.highlight.ry}
          transform={`rotate(${def.highlight.rotate} ${def.highlight.cx} ${def.highlight.cy})`}
          fill={`url(#${id}-glint)`}
        />
      </g>
      {/* A thin rim light keeps the edge crisp against the mocha background. */}
      <path d={def.body} fill="none" stroke="var(--color-platinum)" strokeOpacity="0.35" strokeWidth="0.75" fillRule={fillRule} />
    </svg>
  );
}
