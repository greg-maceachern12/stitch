const FULL_BOOK_PASSCODE =
  process.env.NEXT_PUBLIC_FULL_BOOK_PASSCODE?.trim() || "greenpoint";

export function isFullBookPasscodeValid(code) {
  if (!code) return false;
  return code.trim().toLowerCase() === FULL_BOOK_PASSCODE.toLowerCase();
}
