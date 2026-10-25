// US14/US15/US33 - Lịch sử đơn: lọc, tìm, hủy, thử lại, xác nhận, khiếu nại, đánh giá
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import Navbar from "../components/Navbar";
import OrderActions from "../components/OrderActions";
import { iconForService } from "../components/ServiceIcon";
import { useNow } from "../hooks/useNow";
import { bookingService } from "../services/bookingService";
import { serviceCatalog } from "../services/serviceCatalog";
import { getErrorMessage } from "../services/api";
import { isNetworkError } from "../utils/net";
import { mockOrders } from "../data/mockOrders";
import type { BookingResponse } from "../types";
import { formatVND } from "../utils/format";
import {
  FILTERS,
  STATUS_META,
  describe,
  friendlyDate,
  orderCode,
} from "../utils/booking";
import "../styles/landing.css";
import "../styles/app.css";

const ACTIVE = [0, 1, 2, 3, 10]; // trạng thái đang diễn ra => tự tải lại

export default function Orders() {
  const now = useNow();
  const [orders, setOrders] = useState<BookingResponse[]>([]);
  const [serviceIds, setServiceIds] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const [toast, setToast] = useState("");
  const seq = useRef(0);

  const statuses = useMemo(
    () => FILTERS.find((f) => f.key === filter)?.statuses ?? null,
    [filter],
  );

  // Debounce ô tìm kiếm 400ms
  useEffect(() => {
    const t = setTimeout(() => setQuery(keyword.trim()), 400);
    return () => clearTimeout(t);
  }, [keyword]);

  const load = useCallback(
    async (silent = false) => {
      const my = ++seq.current;
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        // Lọc phía server: ?status=… & ?keyword=… (Hướng dẫn 5.4)
        const list = await bookingService.my({
          status: statuses ?? undefined,
          keyword: query || undefined,
        });
        if (my !== seq.current) return;
        setOrders(
          [...list].sort(
            (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
          ),
        );
        setDemo(false);
      } catch (e) {
        if (my !== seq.current) return;
        if (isNetworkError(e)) {
          // Chưa kết nối được Backend => dữ liệu mẫu, lọc cục bộ giống server
          const q = query.toLowerCase();
          setOrders(
            mockOrders().filter(
              (o) =>
                (!statuses || statuses.includes(o.status)) &&
                (!q ||
                  o.serviceCategoryName.toLowerCase().includes(q) ||
                  o.address.toLowerCase().includes(q)),
            ),
          );
          setDemo(true);
        } else if (!silent) setError(getErrorMessage(e));
      } finally {
        if (my === seq.current && !silent) setLoading(false);
      }
    },
    [statuses, query],
  );

  useEffect(() => {
    load();
  }, [load]);
  // Tự tải lại mỗi 15 giây khi có đơn đang diễn ra
  useEffect(() => {
    if (demo || !orders.some((o) => ACTIVE.includes(o.status))) return;
    const t = setInterval(() => load(true), 15_000);
    return () => clearInterval(t);
  }, [orders, demo, load]);
  useEffect(() => {
    serviceCatalog
      .list()
      .then((d) =>
        setServiceIds(Object.fromEntries(d.map((s) => [s.name, s.id]))),
      )
      .catch(() => undefined);
  }, []);

  const onChanged = (msg: string) => {
    setToast(msg);
    load(true);
  };

  return (
    <>
      <Navbar variant="app" />
      <main className="app-page">
        <div className="container">
          <h1 className="page-title">Đơn của tôi</h1>

          {demo && (
            <div className="form-info">
              Chưa kết nối được Backend – đang hiển thị dữ liệu mẫu theo thiết
              kế. Các nút thao tác sẽ báo lỗi kết nối.
            </div>
          )}
          {toast && (
            <div className="toast" role="status">
              {toast}{" "}
              <button
                type="button"
                className="link-teal"
                onClick={() => setToast("")}
              >
                Đóng
              </button>
            </div>
          )}

          <div className="orders-bar">
            <div
              className="chip-row orders-filters"
              role="tablist"
              aria-label="Lọc đơn"
            >
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={filter === f.key}
                  type="button"
                  className={`chip${filter === f.key ? " chip--on" : ""}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <label className="orders-search">
              <Search size={16} color="#8ca0a8" />
              <input
                type="search"
                placeholder="Tìm theo dịch vụ, địa chỉ…"
                aria-label="Tìm đơn"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </label>
          </div>

          {loading && <p className="muted">Đang tải đơn…</p>}
          {error && (
            <div className="form-error" role="alert">
              {error}{" "}
              <button className="link-teal" onClick={() => load()}>
                Thử lại
              </button>
            </div>
          )}
          {!loading && !error && orders.length === 0 && (
            <div className="empty">
              <p>
                {query || filter !== "all"
                  ? "Không có đơn nào phù hợp."
                  : "Bạn chưa có đơn nào."}
              </p>
              <Link to="/booking/new" className="btn btn-primary">
                Đặt dịch vụ ngay
              </Link>
            </div>
          )}

          <div className="order-list">
            {orders.map((b) => {
              const { Icon } = iconForService(b.serviceCategoryName);
              const meta = STATUS_META[b.status] ?? {
                label: `Trạng thái ${b.status}`,
                tone: "gray" as const,
              };
              const qty = b.quantity ? ` · ${b.quantity}` : "";
              return (
                <article className="order-card" key={b.id}>
                  <Link
                    to={`/bookings/${b.id}`}
                    className="order-main order-main--link"
                    aria-label={`Xem chi tiết đơn ${orderCode(b.id)}`}
                  >
                    <span className="order-icon">
                      <Icon size={29} color="#0f9b8e" />
                    </span>
                    <div className="order-info">
                      <div className="order-head">
                        <b>#{orderCode(b.id)}</b>
                        <span className={`badge badge--${meta.tone}`}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="order-title">
                        {b.serviceCategoryName}
                        {qty} · {friendlyDate(b.scheduledTime)}
                      </div>
                      <div className="order-desc">{describe(b, now)}</div>
                    </div>
                  </Link>
                  <div className="order-side">
                    <span className="order-price">
                      {formatVND(b.totalPrice)}
                    </span>
                    <OrderActions
                      booking={b}
                      serviceIds={serviceIds}
                      onChanged={onChanged}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
