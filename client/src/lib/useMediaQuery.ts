import { useSyncExternalStore } from "react";

// Below Tailwind's `md` breakpoint: the compact phone layout.
// Phones in landscape (667–932px wide) mostly fall on the phone side too.
export const PHONE_QUERY = "(max-width: 767px)";

// True while the media query matches. Re-renders when it changes (rotating the phone).
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
  );
}

export function useIsPhone(): boolean {
  return useMediaQuery(PHONE_QUERY);
}

// A touch screen as the main input: phones and tablets, not laptops.
export function isTouchDevice(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}
