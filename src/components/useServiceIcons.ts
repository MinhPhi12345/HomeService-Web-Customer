import { useEffect, useState } from "react";
import { listServicesCached } from "../services/serviceCatalog";

/** id dịch vụ → ảnh Admin tải lên (null nếu chưa có). Lỗi mạng thì trả về rỗng → dùng icon mặc định. */
export function useServiceIcons(): Record<number, string | null> {
  const [map, setMap] = useState<Record<number, string | null>>({});
  useEffect(() => {
    let alive = true;
    listServicesCached()
      .then((list) => {
        if (alive) setMap(Object.fromEntries(list.map((s) => [s.id, s.iconUrl])));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return map;
}
