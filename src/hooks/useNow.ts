import { useEffect, useState } from "react";

/** Trả về Date.now() cập nhật mỗi giây – dùng cho đồng hồ đếm ngược */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
