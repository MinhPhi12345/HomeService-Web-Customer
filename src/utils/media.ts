import { API_BASE } from "./appConfig";

/** Gốc Backend (bỏ "/api"): "http://localhost:8080/api" → "http://localhost:8080" */
const ORIGIN = API_BASE.replace(/\/api\/?$/, "");

/**
 * Đường dẫn ảnh do Backend lưu ("/uploads/…") → URL đầy đủ theo Backend đang dùng.
 * Ảnh cũ dạng "http://localhost:8080/uploads/…" cũng được đổi sang Backend hiện tại để không bị hỏng khi deploy.
 */
export function mediaUrl(path?: string | null): string {
  if (!path) return "";
  const p = path.trim();
  if (p.startsWith("blob:") || p.startsWith("data:")) return p;
  const m = p.match(/^https?:\/\/[^/]+(\/uploads\/.*)$/i);
  if (m) return `${ORIGIN}${m[1]}`;
  if (/^https?:\/\//i.test(p)) return p;
  return `${ORIGIN}${p.startsWith("/") ? "" : "/"}${p}`;
}
