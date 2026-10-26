// US24 – Thông báo: phân trang, lọc chưa đọc, đánh dấu đã đọc
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellOff, CheckCheck, ChevronRight, RefreshCw } from "lucide-react";
import AppShell from "../components/AppShell";
import { useNotifications } from "../context/NotificationContext";
import { notificationService } from "../services/userServices";
import { getErrorMessage } from "../services/api";
import type { NotificationItem, NotificationPage } from "../types";
import { timeAgo } from "../utils/format";

const PAGE_SIZE = 15;

/** Lấy mã đơn trong nội dung ("đơn #125" hoặc "DH000125") để mở chi tiết đơn */
const bookingIdOf = (n: NotificationItem): number | null => {
  const text = `${n.title} ${n.message}`;
  const m = text.match(/đơn\s*#(\d+)/i) ?? text.match(/DH0*(\d+)/);
  return m ? Number(m[1]) : null;
};

export default function Notifications() {
  const navigate = useNavigate();
  const { setUnread } = useNotifications();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [meta, setMeta] = useState<Omit<NotificationPage, "items"> | null>(null);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (p: number) => {
      setError("");
      if (p === 1) setItems(null);
      else setLoadingMore(true);
      try {
        const r = await notificationService.my(p, PAGE_SIZE, unreadOnly);
        setItems((cur) => (p === 1 ? r.items : [...(cur ?? []), ...r.items]));
        setMeta({ page: r.page, pageSize: r.pageSize, totalCount: r.totalCount, unreadCount: r.unreadCount });
        setUnread(r.unreadCount);
        setPage(p);
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoadingMore(false);
      }
    },
    [unreadOnly, setUnread],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const open = async (n: NotificationItem) => {
    if (!n.isRead) {
      setItems((l) => l?.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)) ?? l);
      setMeta((m) => (m ? { ...m, unreadCount: Math.max(0, m.unreadCount - 1) } : m));
      setUnread(Math.max(0, (meta?.unreadCount ?? 1) - 1));
      notificationService.read(n.id).catch(() => undefined);
    }
    const id = bookingIdOf(n);
    if (id) navigate(`/bookings/${id}`);
  };

  const readAll = async () => {
    try {
      await notificationService.readAll();
      setItems((l) => (unreadOnly ? [] : (l?.map((x) => ({ ...x, isRead: true })) ?? l)));
      setMeta((m) => (m ? { ...m, unreadCount: 0 } : m));
      setUnread(0);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const hasMore = !!meta && !!items && items.length < meta.totalCount;

  return (
    <AppShell narrow>
      <div className="page-head">
        <div>
          <h1 className="page-title">Thông báo</h1>
          <p className="page-sub">{meta ? `${meta.unreadCount} thông báo chưa đọc` : "Đang tải…"}</p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={readAll} disabled={!meta?.unreadCount}>
          <CheckCheck size={16} /> Đánh dấu đã đọc hết
        </button>
      </div>

      <div className="chips noti-filter" role="radiogroup" aria-label="Lọc thông báo">
        <button type="button" role="radio" className="chip" aria-checked={!unreadOnly} onClick={() => setUnreadOnly(false)}>
          Tất cả
        </button>
        <button type="button" role="radio" className="chip" aria-checked={unreadOnly} onClick={() => setUnreadOnly(true)}>
          Chưa đọc
        </button>
      </div>

      {error && (
        <div className="notice notice--danger" role="alert">
          {error}
          <button type="button" className="link notice-action" onClick={() => load(1)}>
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      )}

      {!items && !error ? (
        <div className="noti-list">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 74 }} />
          ))}
        </div>
      ) : items && items.length === 0 ? (
        <div className="panel empty">
          <div className="empty-icon">
            <BellOff size={26} />
          </div>
          <h3>{unreadOnly ? "Bạn đã đọc hết thông báo" : "Chưa có thông báo"}</h3>
          <p>Thông báo về đơn, thanh toán và khiếu nại sẽ hiện ở đây.</p>
        </div>
      ) : (
        items && (
          <ul className="panel noti-list">
            {items.map((n) => {
              const linked = bookingIdOf(n) != null;
              return (
                <li key={n.id}>
                  <button type="button" className={`noti${n.isRead ? "" : " noti--unread"}`} onClick={() => open(n)}>
                    <span className="noti-dot" aria-label={n.isRead ? "Đã đọc" : "Chưa đọc"} />
                    <span className="noti-body">
                      <b>{n.title}</b>
                      <span>{n.message}</span>
                      <small>{timeAgo(n.createdAt)}</small>
                    </span>
                    {linked && <ChevronRight size={18} className="noti-go" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )
      )}
      {hasMore && (
        <div className="pager">
          <button type="button" className="btn btn-outline" onClick={() => load(page + 1)} disabled={loadingMore}>
            {loadingMore ? <span className="spinner" /> : "Xem thêm"}
          </button>
        </div>
      )}
    </AppShell>
  );
}
