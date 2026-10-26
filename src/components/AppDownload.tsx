import { Download, Smartphone } from "lucide-react";
import QrCode from "./QrCode";
import { useApkAvailable } from "../hooks/useApkAvailable";
import { APP_DOWNLOAD } from "../utils/appConfig";

/** Nút tải APK + mã QR – dùng ở trang chủ và trang Trở thành Tasker */
export function DownloadButton({ className = "btn btn-accent btn-lg" }: { className?: string }) {
  const { available, sizeMb } = useApkAvailable();
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

export function DownloadQr() {
  const { available } = useApkAvailable();
  // "localhost" trên điện thoại là chính điện thoại => QR chỉ dùng được khi mở web bằng IP/tên miền
  const local = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return (
    <figure className="qr-card">
      <QrCode value={APP_DOWNLOAD.absoluteUrl()} />
      <figcaption>
        {available === false
          ? "Mã QR dùng được khi đã có bản cài đặt"
          : local
            ? "Mở website bằng địa chỉ IP của máy tính để điện thoại quét được mã này"
            : "Quét bằng camera điện thoại Android để tải"}
      </figcaption>
    </figure>
  );
}
