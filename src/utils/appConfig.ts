/**
 * Thông tin tải ứng dụng di động.
 * File APK đặt trong thư mục public/downloads của Web Customer (Vite phục vụ nguyên file),
 * hoặc đổi sang link khác bằng biến môi trường VITE_APK_URL.
 */
const apkUrl = import.meta.env.VITE_APK_URL || "/downloads/HomeService.apk";

export const APP_DOWNLOAD = {
  apkUrl,
  version: import.meta.env.VITE_APK_VERSION || "1.0.0",
  /** Link tuyệt đối (để tạo mã QR quét bằng điện thoại) */
  absoluteUrl: () => new URL(apkUrl, window.location.origin).toString(),
};

/** Gốc của Backend (bỏ "/api") – dùng cho ảnh nền bản đồ */
export const API_BASE: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";
