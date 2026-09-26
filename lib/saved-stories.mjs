export const savedKey = "ai-morning-saved-stories-v2";
export function readSaved() {
  try {
    const value = JSON.parse(localStorage.getItem(savedKey) || "[]");
    return Array.isArray(value)
      ? value.filter(
          (item) =>
            typeof item.id === "string" &&
            typeof item.href === "string" &&
            item.href.startsWith("/") &&
            !item.href.startsWith("//") &&
            typeof item.title === "string",
        )
      : [];
  } catch {
    return [];
  }
}
