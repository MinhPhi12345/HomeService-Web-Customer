// US14/US15/US33 – Đơn của tôi: lọc theo trạng thái, tìm kiếm, thao tác nhanh
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays, ClipboardList, MapPin, Plus, RefreshCw, Search } from "lucide-react";
import AppShell from "../components/AppShell";
import OrderActions from "../components/OrderActions";
import { Toast } from "../components/Modal";
import ServiceBadge from "../components/ServiceBadge";
import { useServiceIcons } from "../components/useServiceIcons";
import { useNow } from "../hooks/useNow";
import { bookingService } from "../services/bookingService";
import { getErrorMessage } from "../services/api";
import type { BookingResponse } from "../types";
import { formatVND } from "../utils/format";
import { FILTERS, STATUS_META, describe, friendlyDate, orderCode } from "../utils/booking";

const ACTIVE = [0, 1, 2, 3, 10]; // đang diễn ra => tự tải lại

export default function Orders() {
  const now = useNow();
  const icons = useServiceIcons();
  const [params, setParams] = useSearchParams();
  const filter = FILTERS.some((f) => f.key === params.get("tab")) ? params.get("tab")! : "all";
  const [orders, setOrders] = useState<BookingResponse[] | null>(null);
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const seq = useRef(0);

  const statuses = useMemo(() => FILTERS.find((f) => f.key === filter)?.statuses ?? null, [filter]);

  useEffect(() => {
    const t = setTimeout(() => setQuery(keyword.trim()), 400);
    return () => clearTimeout(t);
  }, [keyword]);

  const load = useCallback(
    async (silent = false) => {
      const my = ++seq.current;
      if (!silent) {
        setOrders(null);
        setError("");
      }
      try {
        const list = await bookingService.my({ status: statuses ?? undefined, keyword: query || undefined });
        if (my !== seq.current) return;
        setOrders([...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
      } catch (e) {
        if (my === seq.current && !silent) setError(getErrorMessage(e));
      }
    },
    [statuses, query],
  );

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!orders?.some((o) => ACTIVE.includes(o.status))) return;
    const t = setInterval(() => load(true), 15_000);
    return () => clearInterval(t);
  }, [orders, load]);

  const onChanged = (msg: string) => {
    setToast(msg);
    load(true);
  };
  const closeToast = useCallback(() => setToast(""), []);

  return (
    <AppShell>
      <div className="page-head">
        <div>
          <h1 className="page-title">Đơn của tôi</h1>
          <p className="page-sub">Đơn đang diễn ra tự cập nhật mỗi 15 giây.</p>
        </div>
        <Link to="/booking/new" className="btn btn-primary">
          <Plus size={18} /> Đặt đơn mới
        </Link>
      </div>

      <div className="orders-bar">
        <div className="tabs" role="tablist" aria-label="Lọc theo trạng thái">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className="tab"
              onClick={() => setParams(f.key === "all" ? {} : { tab: f.key }, { replace: true })}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="input-icon orders-search">
          <Search size={18} />
          <input
            className="input"
            type="search"
            placeholder="Tìm dịch vụ, địa chỉ…"
            aria-label="Tìm đơn"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="notice notice--danger" role="alert">
          {error}
          <button type="button" className="link notice-action" onClick={() => load()}>
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      ) : !orders ? (
        <div className="order-list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 150 }} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="panel empty">
          <div className="empty-icon">
            <ClipboardList size={28} />
          </div>
          <h3>{query ? "Không có đơn khớp từ khóa" : filter === "all" ? "Bạn chưa có đơn nào" : "Không có đơn ở mục này"}</h3>
          <p>{query ? "Thử từ khóa khác hoặc xóa ô tìm kiếm." : "Đặt dịch vụ đầu tiên, chỉ mất khoảng 2 phút."}</p>
          {!query && (
            <Link to="/booking/new" className="btn btn-primary">
              Đặt dịch vụ
            </Link>
          )}
        </div>
      ) : (
        <ul className="order-list">
          {orders.map((o) => {
            const meta = STATUS_META[o.status] ?? { label: `Trạng thái ${o.status}`, tone: "gray" as const };
            return (
              <li key={o.id} className="order">
                <Link to={`/bookings/${o.id}`} className="order-main">
                  <ServiceBadge name={o.serviceCategoryName} iconUrl={icons[o.serviceCategoryId ?? 0]} size={22} />
                  <div className="order-info">
                    <div className="order-top">
                      <h3>{o.serviceCategoryName}</h3>
                      <span className={`badge badge--${meta.tone}`}>{meta.label}</span>
                    </div>
                    <div className="order-meta">
                      <span>#{orderCode(o.id)}</span>
                      <span>
                        <CalendarDays size={14} /> {friendlyDate(o.scheduledTime)}
                      </span>
                      <span className="order-addr">
                        <MapPin size={14} /> {o.address}
                      </span>
                    </div>
                    <p className="order-desc">{describe(o, now)}</p>
                  </div>
                  <strong className="order-price">{formatVND(o.totalPrice)}</strong>
                </Link>
                <div className="order-actions">
                  <OrderActions booking={o} onChanged={onChanged} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Toast message={toast} onClose={closeToast} />
    </AppShell>
  );
}
