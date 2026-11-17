// No 0/O or 1/I: they look alike when someone reads a code out loud or off a screen.
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 6;

// Makes a random 6-character code that isn't already in use.
// 32^6 is about a billion codes, so a collision is rare, but we still check.
export function generateRoomCode(isTaken: (code: string) => boolean, random: () => number = Math.random): string {
  for (let attempt = 0; attempt < 100; attempt++) {
    let code = "";
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      const index = Math.floor(random() * ROOM_CODE_ALPHABET.length);
      code += ROOM_CODE_ALPHABET[index] ?? "A";
    }
    if (!isTaken(code)) {
      return code;
    }
  }
  throw new Error("Could not find a free room code");
}
