export const cx = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

export const shuffle = <T,>(list: T[]) => {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

export const randomCode = (length: number) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export const formatMs = (ms: number) => {
  const seconds = Math.ceil(ms / 1000);
  return `${seconds}s`;
};
