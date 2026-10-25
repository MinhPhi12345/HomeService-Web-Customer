import { storage } from "../services/api";

/**
 * Chuyển phiên đăng nhập giữa 2 website (Web Customer 5173 <-> Web Admin 5174).
 * localStorage không dùng chung giữa 2 origin nên token được đưa qua URL hash (#auth=...).
 * Hash không gửi lên server và được xóa khỏi thanh địa chỉ ngay khi trang đích đọc xong.
 */
export interface HandoffUser {
  userId: number;
  fullName: string;
  email: string;
  role: number;
}
export interface HandoffPayload {
  token: string;
  user: HandoffUser;
  remember: boolean;
}

const enc = (o: unknown) => {
  const bytes = new TextEncoder().encode(JSON.stringify(o));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};
const dec = (s: string): HandoffPayload => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return JSON.parse(
    new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))),
  );
};

export const buildHandoffUrl = (baseUrl: string, p: HandoffPayload) =>
  `${baseUrl.replace(/\/$/, "")}/#auth=${enc(p)}`;

/** Gọi trước khi render. Chỉ nhận phiên có role đúng với website này, sai role thì bỏ qua. */
export function consumeHandoff(allowedRole: number): void {
  const m = location.hash.match(/^#auth=(.+)$/);
  if (!m) return;
  history.replaceState(null, "", location.pathname + location.search); // xóa token khỏi URL ngay
  try {
    const p = dec(m[1]);
    if (!p.token || p.user?.role !== allowedRole) return;
    const store = p.remember ? localStorage : sessionStorage;
    for (const s of [localStorage, sessionStorage]) {
      s.removeItem(storage.TOKEN_KEY);
      s.removeItem(storage.USER_KEY);
    }
    store.setItem(storage.TOKEN_KEY, p.token);
    store.setItem(storage.USER_KEY, JSON.stringify(p.user));
  } catch {
    /* hash hỏng: bỏ qua */
  }
}
