import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { notificationService } from "../services/userServices";
import { isNetworkError } from "../utils/net";
import { mockNotifications } from "../data/mockUser";

interface Ctx {
  unreadCount: number;
  refresh: () => void;
  setUnread: (n: number) => void;
}
const NotiCtx = createContext<Ctx>({
  unreadCount: 0,
  refresh: () => undefined,
  setUnread: () => undefined,
});

/** Số thông báo chưa đọc trên chuông – gọi lại mỗi 30 giây (Hướng dẫn 5.6) */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnread] = useState(0);

  const refresh = useCallback(() => {
    if (!user) return setUnread(0);
    notificationService
      .my(1, 1)
      .then((r) => setUnread(r.unreadCount))
      .catch((e) =>
        setUnread(
          isNetworkError(e)
            ? mockNotifications().filter((n) => !n.isRead).length
            : 0,
        ),
      );
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, [user, refresh]);

  const value = useMemo(
    () => ({ unreadCount, refresh, setUnread }),
    [unreadCount, refresh],
  );
  return <NotiCtx.Provider value={value}>{children}</NotiCtx.Provider>;
}

export const useNotifications = () => useContext(NotiCtx);
