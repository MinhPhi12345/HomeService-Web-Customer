import { useEffect, useState } from "react";
import { APP_DOWNLOAD } from "../utils/appConfig";

export interface ApkInfo {
  /** null: đang kiểm tra */
  available: boolean | null;
  sizeMb: number | null;
}

/** Kiểm tra file APK đã được đặt vào public/downloads chưa (dev server trả index.html nếu thiếu file) */
export function useApkAvailable(): ApkInfo {
  const [info, setInfo] = useState<ApkInfo>({ available: null, sizeMb: null });
  useEffect(() => {
    let stop = false;
    fetch(APP_DOWNLOAD.apkUrl, { method: "HEAD" })
      .then((r) => {
        const type = r.headers.get("content-type") ?? "";
        const len = Number(r.headers.get("content-length") ?? 0);
        const ok = r.ok && !type.includes("text/html");
        if (!stop)
          setInfo({
            available: ok,
            sizeMb: ok && len > 0 ? Math.round((len / 1048576) * 10) / 10 : null,
          });
      })
      .catch(() => !stop && setInfo({ available: false, sizeMb: null }));
    return () => {
      stop = true;
    };
  }, []);
  return info;
}
