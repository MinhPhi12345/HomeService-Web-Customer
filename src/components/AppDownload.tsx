import { Download, Info, Smartphone } from "lucide-react";
import QrCode from "./QrCode";
import { useApkAvailable } from "../hooks/useApkAvailable";
import { APP_DOWNLOAD } from "../utils/appConfig";

/** iPhone / iPad không cài được file APK (iPadOS 13+ báo là "Macintosh" nhưng có màn hình cảm ứng) */
function isAppleMobile(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}

/** Nút tải APK + mã QR – dùng ở trang chủ và trang Trở thành Tasker */
export function DownloadButton({ className = "btn btn-accent btn-lg" }: { className?: string }) {
  const { available, sizeMb } = useApkAvailable();
  if (isAppleMobile())
    return (
      <span className="apk-missing">
        <Info size={18} /> Ứng dụng hiện có cho Android. Trên iPhone, bạn dùng ngay website này để đặt và theo dõi đơn.
      </span>
    );
  if (available === false)
    return (
      <span className="apk-missing">
        <Smartphone size={18} /> Bản cài đặt Android đang được cập nhật, vui lòng quay lại sau.
      </span>
    );
  return (
    <a
      className={className}
      href={APP_DOWNLOAD.apkUrl}
      download="HomeService.apk"
      type="application/vnd.android.package-archive"
      aria-disabled={available === null}
    >
      <Download size={19} />
      Tải ứng dụng Android
      <small>
        v{APP_DOWNLOAD.version}
        {sizeMb ? ` · ${sizeMb} MB` : ""}
      </small>
    </a>
  );
}

/** Hướng dẫn cài APK (Android 7.0 trở lên) */
export function InstallHelp() {
  if (isAppleMobile()) return null;
  return (
    <details className="install-help">
      <summary>Cách cài file APK</summary>
      <ol>
        <li>Bấm “Tải ứng dụng Android” trên điện thoại Android 7.0 trở lên, hoặc quét mã QR.</li>
        <li>Mở file HomeService.apk vừa tải (trong thông báo hoặc mục Tệp đã tải xuống).</li>
        <li>Nếu máy hỏi, bật “Cho phép cài ứng dụng từ nguồn này” cho trình duyệt rồi quay lại bấm Cài đặt.</li>
        <li>Nếu Google Play Protect hiện cảnh báo, chọn “Chi tiết” → “Vẫn cài đặt”. Ứng dụng chưa phát hành trên CH Play nên máy hỏi thêm bước này.</li>
        <li>Mở ứng dụng và đăng nhập bằng tài khoản đã đăng ký trên website. Khi có bản mới, tải và cài đè lên – dữ liệu vẫn giữ nguyên.</li>
      </ol>
    </details>
  );
}

export function DownloadQr() {
  const { available } = useApkAvailable();
  return (
    <figure className="qr-card">
      <QrCode value={APP_DOWNLOAD.absoluteUrl()} />
      <figcaption>
        {available === false ? "Mã QR dùng được khi đã có bản cài đặt" : "Quét bằng camera điện thoại Android để tải"}
      </figcaption>
    </figure>
  );
}
