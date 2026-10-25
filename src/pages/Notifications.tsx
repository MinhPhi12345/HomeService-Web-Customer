// US29 - Thông báo trạng thái đơn, nhắc lịch
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import Navbar from "../components/Navbar";
import { useNotifications } from "../context/NotificationContext";
import { notificationService } from "../services/userServices";
import { getErrorMessage } from "../services/api";
import { isNetworkError } from "../utils/net";
import { mockNotifications } from "../data/mockUser";
import type { NotificationItem } from "../types";
import "../styles/landing.css";
import "../styles/app.css";

const PAGE_SIZE = 20;

function ago(iso: string) {
  const min = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 60_000),
  );
  if (min < 1) return "Vừa xong";
  if (min < 60) return `${min} phút trước`;
  if (min < 60 * 24) return `${Math.floor(min / 60)} giờ trước`;
  if (min < 60 * 24 * 7) return `${Math.floor(min / 60 / 24)} ngày trước`;
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}
/** Tìm mã đơn DH000125 trong nội dung để liên kết tới chi tiết đơn */
const orderIdOf = (n: NotificationItem) => {
  const m = `${n.title} ${n.message}`.match(/DH0*(\d+)/);
  return m ? Number(m[1]) : null;
};

export default function Notifications() {
  const { setUnread, refresh } = useNotifications();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await notificationService.my(page, PAGE_SIZE, tab === "unread");
      setItems(r.items);
      setTotal(r.totalCount);
      setUnread(r.unreadCount);
      setDemo(false);
    } catch (e) {
      if (isNetworkError(e)) {
        const all = mockNotifications().filter(
          (n) => tab === "all" || !n.isRead,
        );
        setItems(all);
        setTotal(all.length);
        setDemo(true);
      } else setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, tab, setUnread]);
  useEffect(() => {
    load();
  }, [load]);

  const unreadHere = items.filter((n) => !n.isRead).length;
  const markRead = async (n: NotificationItem) => {
    if (n.isRead) return;
    setItems((l) => l.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    setUnread(Math.max(0, unreadHere - 1));
    if (!demo)
      notificationService
        .read(n.id)
        .then(refresh)
        .catch(() => load());
  };
  const markAll = async () => {
    try {
      if (!demo) await notificationService.readAll();
      setItems((l) => l.map((x) => ({ ...x, isRead: true })));
      setUnread(0);
      if (tab === "unread") setItems([]);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Navbar variant="app" />
      <main className="app-page">
        <div className="container narrow">
          <div className="page-head">
            <h1 className="page-title">Thông báo</h1>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={markAll}
              disabled={unreadHere === 0 && tab === "all"}
            >
              Đánh dấu tất cả đã đọc
            </button>
          </div>
          {demo && (
            <div className="form-info">
              Chưa kết nối được Backend – đang hiển thị dữ liệu mẫu.
            </div>
          )}
          <div className="chip-row orders-filters" role="tablist">
            {(
              [
                ["all", "Tất cả"],
                ["unread", "Chưa đọc"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                type="button"
                className={`chip${tab === k ? " chip--on" : ""}`}
                onClick={() => {
                  setTab(k);
                  setPage(1);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {loading && <p className="muted">Đang tải thông báo…</p>}
          {error && (
            <div className="form-error" role="alert">
              {error}{" "}
              <button className="link-teal" onClick={load}>
                Thử lại
              </button>
            </div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="empty">
              <p>
                {tab === "unread"
                  ? "Bạn đã đọc hết thông báo."
                  : "Bạn chưa có thông báo nào."}
              </p>
            </div>
          )}

          <ul className="noti-list">
            {items.map((n) => {
              const oid = orderIdOf(n);
              return (
                <li
                  key={n.id}
                  className={`noti${n.isRead ? "" : " noti--unread"}`}
                >
                  <button
                    type="button"
                    className="noti-main"
                    onClick={() => markRead(n)}
                  >
                    <span className="noti-icon">
                      <Bell size={18} color="#0f9b8e" />
                    </span>
                    <span className="noti-text">
                      <b>{n.title}</b>
                      <span>{n.message}</span>
                      <small>{ago(n.createdAt)}</small>
                    </span>
                    {!n.isRead && (
                      <i className="noti-dot" aria-label="Chưa đọc" />
                    )}
                  </button>
                  {oid && (
                    <Link
                      to={`/bookings/${oid}`}
                      className="noti-link"
                      onClick={() => markRead(n)}
                    >
                      Xem đơn
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          {pages > 1 && (
            <div className="pager">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Trước
              </button>
              <span>
                Trang {page} / {pages}
              </span>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
