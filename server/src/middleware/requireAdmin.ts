import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { HttpError } from "./errorHandler";

export const ADMIN_HEADER = "x-admin-password";

// Hashing both values first gives equal-length buffers, which timingSafeEqual
// needs. Comparing in constant time means response timing can't reveal how
// many characters of a guess were right.
function sameSecret(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

// Simple shared-password protection for the admin API (see README for limits).
export function requireAdmin(adminPassword: string): RequestHandler {
  return (req, _res, next) => {
    const given = req.header(ADMIN_HEADER);
    if (given === undefined || !sameSecret(given, adminPassword)) {
      next(new HttpError(401, "Wrong admin password"));
      return;
    }
    next();
  };
}
