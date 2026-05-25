const FULL_BOOK_PASSCODE =
  process.env.NEXT_PUBLIC_FULL_BOOK_PASSCODE?.trim() || "greenpoint";

export const FULL_BOOK_UNLOCK_STORAGE_KEY = "visuai-full-book-unlocked";

export function isFullBookPasscodeValid(code) {
  if (!code) return false;
  return code.trim().toLowerCase() === FULL_BOOK_PASSCODE.toLowerCase();
}

export function readFullBookUnlockFromSession() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(FULL_BOOK_UNLOCK_STORAGE_KEY) === "1";
}

export function persistFullBookUnlock() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(FULL_BOOK_UNLOCK_STORAGE_KEY, "1");
}
