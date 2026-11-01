// Đếm ngược "Gửi lại mã" OTP
import { useEffect, useState } from "react";

/** Đếm ngược thời gian chờ trước khi được gửi lại mã. */
export function useResendTimer(initialSeconds = 0) {
  const [left, setLeft] = useState(initialSeconds);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return { left, restart: (seconds: number) => setLeft(seconds) };
}

/** Lấy số giây trong thông báo 429 "Vui lòng đợi 42 giây…" để đồng bộ đồng hồ */
export function secondsFromMessage(message: string): number | null {
  const m = /đợi (\d+) giây/.exec(message);
  return m ? Number(m[1]) : null;
}
