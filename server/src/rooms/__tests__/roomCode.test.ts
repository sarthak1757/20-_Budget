import { describe, expect, it } from "vitest";
import { roomCodeSchema } from "@budget-draft/shared";
import { generateRoomCode } from "../roomCode";

describe("generateRoomCode", () => {
  it("makes 6-character codes without look-alike characters", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode(() => false);
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
      expect(roomCodeSchema.safeParse(code).success).toBe(true);
    }
  });

  it("tries again when a code is taken", () => {
    const taken = new Set(["AAAAAA"]);
    let calls = 0;
    // First 6 calls produce "AAAAAA", then "BBBBBB".
    const random = () => (calls++ < 6 ? 0 : 1 / 32);
    expect(generateRoomCode((code) => taken.has(code), random)).toBe("BBBBBB");
  });
});
