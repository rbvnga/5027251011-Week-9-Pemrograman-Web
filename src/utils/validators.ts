// Hanya menerima URL yang diawali http:// atau https://
export const isHttpUrl = (v: string): boolean => {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};