export const formatFirebaseError = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error && "code" in error) {
    const code = String((error as { code?: string }).code);
    switch (code) {
      case "permission-denied":
        return "Firestore rejected the request. Check your Firestore security rules.";
      case "unauthenticated":
        return "Firestore requires authentication. Update your rules to allow public access.";
      case "unavailable":
        return "Firestore is temporarily unavailable. Try again in a moment.";
      default:
        break;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const createGuestId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `guest_${Math.random().toString(36).slice(2, 10)}${Date.now()
    .toString(36)
    .slice(-4)}`;
};

export const getStoredGuestId = () => {
  if (typeof window === "undefined") return createGuestId();
  try {
    const key = "family-quiz-player-id";
    const stored = window.sessionStorage.getItem(key);
    if (stored) return stored;
    const next = createGuestId();
    window.sessionStorage.setItem(key, next);
    return next;
  } catch {
    return createGuestId();
  }
};
