// Remembers things between visits in localStorage:
// - the player id for each room, so a refresh or dropped connection puts you back in your seat
// - the last name you used, so you don't have to type it every time
// localStorage can throw (private mode, storage full), so every call is wrapped.

const NAME_KEY = "budget-draft:name";

function roomKey(code: string): string {
  return `budget-draft:room:${code.toUpperCase()}`;
}

export function getStoredPlayerId(code: string): string | undefined {
  try {
    return localStorage.getItem(roomKey(code)) ?? undefined;
  } catch {
    return undefined;
  }
}

export function storePlayerId(code: string, playerId: string): void {
  try {
    localStorage.setItem(roomKey(code), playerId);
  } catch {
    // Not fatal: reconnecting just won't work after a full page reload.
  }
}

export function forgetRoom(code: string): void {
  try {
    localStorage.removeItem(roomKey(code));
  } catch {
    // ignore
  }
}

export function getStoredName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function storeName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // ignore
  }
}
