export function formatImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  
  // Get backend base origin from environment or default
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  const origin = apiBase.replace("/api", "");
  
  return `${origin}${url}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";

    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();

    return `${d}/${m}/${y}`;
  } catch (e) {
    return "N/A";
  }
}
