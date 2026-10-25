// US19/US25/US34/US35/US36/US37 - Chi tiết đơn: theo dõi Tasker, xác nhận, khiếu nại, đánh giá, trả nợ
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Camera, Star } from "lucide-react";
import Navbar from "../components/Navbar";
import OrderActions from "../components/OrderActions";
import TrackingMap from "../components/TrackingMap";
import { iconForService } from "../components/ServiceIcon";
import { useNow } from "../hooks/useNow";
import {
  bookingService,
  disputeService,
  reviewService,
} from "../services/bookingService";
import { serviceCatalog } from "../services/serviceCatalog";
import { getErrorMessage } from "../services/api";
import { isNetworkError } from "../utils/net";
import { mockOrders, mockTaskerLocation } from "../data/mockOrders";
import { mockBookingReviews, mockUserReviews } from "../data/mockUser";
import type {
  BookingResponse,
  DisputeDetail,
  LocationResponse,
  ReviewItem,
  UserReviews,
} from "../types";
import { formatDateTime, formatVND } from "../utils/format";
import {
  DISPUTE_REASONS,
  DISPUTE_RESOLUTIONS,
  METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  STATUS_META,
  countdown,
  describe,
  orderCode,
} from "../utils/booking";
import "../styles/landing.css";
import "../styles/app.css";

const STEPS = [
  "Đã đặt",
  "Tìm Tasker",
  "Đã nhận",
  "Đang làm",
  "Hoàn thành",
  "Thanh toán xong",
];
const STEP_OF: Record<number, number> = {
  10: 0,
  0: 1,
  1: 1,
  8: 1,
  2: 2,
  3: 3,
  4: 4,
  11: 4,
  13: 4,
  5: 5,
};
const LIVE = [0, 1, 2, 3];

const Stars = ({ n }: { n: number }) => (
  <span className="stars-inline" aria-label={`${n} sao`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={14}
        fill={i <= Math.round(n) ? "#ffb938" : "none"}
        color={i <= Math.round(n) ? "#ffb938" : "#c5d1d5"}
      />
    ))}
  </span>
);

const mockDispute = (b: BookingResponse): DisputeDetail => ({
  id: b.disputeId ?? 7,
  bookingId: b.id,
  amount: b.totalPrice,
  reason: 0,
  description: "Phòng khách vẫn còn bụi, nhà vệ sinh chưa được lau kỹ.",
  evidenceUrls: [],
  taskerResponse: null,
  taskerEvidenceUrls: [],
  status: 0,
  resolution: null,
  refundAmount: null,
  adminNote: null,
  createdAt: new Date().toISOString(),
  resolvedAt: null,
});

export default function BookingDetail() {
  const { id } = useParams();
  const bookingId = Number(id);
  const { hash } = useLocation();
  const now = useNow();
  const [b, setB] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const [serviceIds, setServiceIds] = useState<Record<string, number>>({});
  const [tasker, setTasker] = useState<UserReviews | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [loc, setLoc] = useState<LocationResponse | null>(null);
  const [locMsg, setLocMsg] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const data = await bookingService.get(bookingId);
        setB(data);
        setDemo(false);
      } catch (e) {
        if (isNetworkError(e)) {
          const m = mockOrders().find((o) => o.id === bookingId);
          if (m) {
            setB(m);
            setDemo(true);
          } else if (!silent)
            setError("Không tìm thấy đơn (chưa kết nối được Backend).");
        } else if (!silent)
          setError(
            axios.isAxiosError(e) && e.response?.status === 404
              ? "Không tìm thấy đơn."
              : getErrorMessage(e),
          );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [bookingId],
  );

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    serviceCatalog
      .list()
      .then((d) =>
        setServiceIds(Object.fromEntries(d.map((s) => [s.name, s.id]))),
      )
      .catch(() => undefined);
  }, []);

  // Đơn đang diễn ra: tự tải lại mỗi 10 giây
  useEffect(() => {
    if (!b || demo || !LIVE.includes(b.status)) return;
    const t = setInterval(() => load(true), 10_000);
    return () => clearInterval(t);
  }, [b, demo, load]);

  // Điểm đánh giá Tasker + đánh giá của đơn
  useEffect(() => {
    if (!b?.taskerId) {
      setTasker(null);
      return;
    }
    reviewService
      .forUser(b.taskerId)
      .then(setTasker)
      .catch((e) => setTasker(isNetworkError(e) ? mockUserReviews() : null));
  }, [b?.taskerId]);
  useEffect(() => {
    if (!b) return;
    reviewService
      .forBooking(b.id)
      .then(setReviews)
      .catch((e) =>
        setReviews(
          isNetworkError(e) && b.status === 5 && b.taskerId
            ? mockBookingReviews(b.taskerId)
            : [],
        ),
      );
  }, [b?.id, b?.status, b?.taskerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Kết quả khiếu nại
  useEffect(() => {
    if (!b?.disputeId) {
      setDispute(null);
      return;
    }
    disputeService
      .get(b.disputeId)
      .then(setDispute)
      .catch((e) => setDispute(isNetworkError(e) ? mockDispute(b) : null));
  }, [b?.disputeId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (hash === "#khieu-nai" && dispute)
      document
        .getElementById("khieu-nai")
        ?.scrollIntoView({ behavior: "smooth" });
  }, [hash, dispute]);

  // Theo dõi vị trí Tasker mỗi 10 giây khi đơn ở trạng thái 2 hoặc 3
  const tracking = b?.status === 2 || b?.status === 3;
  useEffect(() => {
    if (!b || !tracking) {
      setLoc(null);
      setLocMsg("");
      return;
    }
    let stop = false;
    const tick = () => {
      if (demo) {
        setLoc(mockTaskerLocation(b));
        setLocMsg("");
        return;
      }
      bookingService
        .location(b.id)
        .then((r) => {
          if (!stop) {
            setLoc(r);
            setLocMsg("");
          }
        })
        .catch((e) => {
          if (!stop) {
            setLoc(null);
            setLocMsg(
              axios.isAxiosError(e) && e.response?.status === 404
                ? "Tasker chưa chia sẻ vị trí"
                : getErrorMessage(e),
            );
          }
        });
    };
    tick();
    const t = setInterval(tick, 10_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [b?.id, tracking, demo]); // eslint-disable-line react-hooks/exhaustive-deps

  const report = async (r: ReviewItem) => {
    try {
      await reviewService.report(r.id);
      setToast("Đã gửi báo cáo đánh giá cho quản trị viên.");
      setReviews((l) =>
        l.map((x) => (x.id === r.id ? { ...x, isFlagged: true } : x)),
      );
    } catch (e) {
      setToast(getErrorMessage(e));
    }
  };

  if (loading)
    return (
      <>
        <Navbar variant="app" />
        <main className="app-page">
          <div className="container">
            <p className="muted">Đang tải đơn…</p>
          </div>
        </main>
      </>
    );
  if (error || !b)
    return (
      <>
        <Navbar variant="app" />
        <main className="app-page">
          <div className="container">
            <div className="form-error" role="alert">
              {error || "Không tìm thấy đơn."}
            </div>
            <Link to="/bookings" className="back-link">
              <ArrowLeft size={14} /> Quay lại Đơn của tôi
            </Link>
          </div>
        </main>
      </>
    );

  const meta = STATUS_META[b.status] ?? {
    label: `Trạng thái ${b.status}`,
    tone: "gray" as const,
  };
  const { Icon } = iconForService(b.serviceCategoryName);
  const step = STEP_OF[b.status];
  const closed = [6, 9, 12, 7].includes(b.status);
  const home =
    b.latitude != null && b.longitude != null
      ? { lat: b.latitude, lng: b.longitude }
      : null;

  const rows: [string, string][] = [
    [
      "Dịch vụ",
      `${b.serviceCategoryName}${b.quantity ? ` · ${b.quantity}` : ""}`,
    ],
    ["Thời gian hẹn", formatDateTime(b.scheduledTime)],
    ["Địa chỉ", b.address],
    ...(b.note ? ([["Ghi chú", b.note]] as [string, string][]) : []),
    [
      "Thanh toán",
      `${METHOD_LABEL[b.paymentMethod] ?? "—"}${b.paymentStatus != null ? ` · ${PAYMENT_STATUS_LABEL[b.paymentStatus] ?? ""}` : ""}`,
    ],
    ...((b.cancellationFee ?? 0) > 0
      ? ([["Phí hủy", formatVND(b.cancellationFee!)]] as [string, string][])
      : []),
    ["Ngày tạo", formatDateTime(b.createdAt)],
  ];

  return (
    <>
      <Navbar variant="app" />
      <main className="app-page">
        <div className="container detail-wrap">
          <Link to="/bookings" className="back-link">
            <ArrowLeft size={14} /> Quay lại Đơn của tôi
          </Link>
          {demo && (
            <div className="form-info">
              Chưa kết nối được Backend – đang hiển thị dữ liệu mẫu.
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

          <header className="detail-head">
            <span className="order-icon">
              <Icon size={29} color="#0f9b8e" />
            </span>
            <div>
              <h1 className="page-title">Đơn #{orderCode(b.id)}</h1>
              <span className={`badge badge--${meta.tone}`}>{meta.label}</span>
            </div>
            <span className="order-price detail-price">
              {formatVND(b.totalPrice)}
            </span>
          </header>

          <p className="detail-note">{describe(b, now)}</p>
          {b.status === 10 && b.paymentDueAt && (
            <p className="detail-note detail-note--warn">
              Hạn thanh toán còn {countdown(b.paymentDueAt, now)}
            </p>
          )}
          {b.status === 4 && b.autoConfirmAt && (
            <p className="detail-note detail-note--warn">
              Tự xác nhận hoàn thành sau {countdown(b.autoConfirmAt, now)}. Hãy
              xem ảnh trước/sau rồi xác nhận hoặc khiếu nại.
            </p>
          )}

          {step !== undefined && !closed && (
            <ol className="stepper-line" aria-label="Tiến độ đơn">
              {STEPS.map((s, i) => (
                <li
                  key={s}
                  className={i < step ? "done" : i === step ? "now" : ""}
                >
                  <i>{i < step ? "✓" : i + 1}</i>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          )}

          <div className="actions-bar">
            <OrderActions
              booking={b}
              serviceIds={serviceIds}
              inDetail
              onChanged={(m) => {
                setToast(m);
                load(true);
              }}
            />
          </div>

          <div className="detail-grid">
            <div className="detail-col">
              <section className="card detail-card">
                <h2>Thông tin đơn</h2>
                {rows.map(([k, v]) => (
                  <div className="kv-row" key={k}>
                    <span>{k}</span>
                    <b>{v}</b>
                  </div>
                ))}
              </section>

              {tracking && (
                <section className="card detail-card">
                  <h2>Vị trí Tasker</h2>
                  {home ? (
                    <TrackingMap
                      home={home}
                      tasker={
                        loc ? { lat: loc.latitude, lng: loc.longitude } : null
                      }
                    />
                  ) : (
                    <p className="muted">
                      Đơn chưa có tọa độ để hiển thị bản đồ.
                    </p>
                  )}
                  <p className="muted">
                    {loc
                      ? `Cập nhật ${formatDateTime(loc.updatedAt).slice(-5)}${loc.distanceKm != null ? ` · còn khoảng ${loc.distanceKm} km` : ""} (tự làm mới mỗi 10 giây)`
                      : locMsg || "Đang tải vị trí…"}
                  </p>
                </section>
              )}

              {(b.checkInPhotoUrl || b.checkOutPhotoUrl) && (
                <section className="card detail-card">
                  <h2>Ảnh trước / sau khi làm</h2>
                  <div className="photo-pair">
                    {(
                      [
                        ["Trước", b.checkInPhotoUrl],
                        ["Sau", b.checkOutPhotoUrl],
                      ] as const
                    ).map(([label, url]) => (
                      <figure key={label}>
                        {url && url !== "demo" ? (
                          <a href={url} target="_blank" rel="noreferrer">
                            <img
                              src={url}
                              alt={`Ảnh ${label.toLowerCase()} khi làm`}
                            />
                          </a>
                        ) : (
                          <div className="photo-ph">
                            <Camera size={24} color="#0f9b8e" />
                          </div>
                        )}
                        <figcaption>{label}</figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="detail-col">
              {b.taskerId && (
                <section className="card detail-card">
                  <h2>Tasker</h2>
                  <div className="tasker-row">
                    <span className="detail-avatar-lg">
                      {(b.taskerName ?? "T")
                        .trim()
                        .split(/\s+/)
                        .pop()
                        ?.charAt(0)
                        .toUpperCase()}
                    </span>
                    <div>
                      <b>{b.taskerName}</b>
                      {tasker && (
                        <div className="rating-line">
                          {tasker.ratingAverage != null ? (
                            <>
                              <Stars n={tasker.ratingAverage} />{" "}
                              <span>
                                {tasker.ratingAverage.toFixed(1)} ·{" "}
                                {tasker.reviewCount} đánh giá
                              </span>
                            </>
                          ) : (
                            <span>Chưa có đánh giá</span>
                          )}
                        </div>
                      )}
                      {b.taskerPhone && (
                        <a className="phone-link" href={`tel:${b.taskerPhone}`}>
                          {b.taskerPhone}
                        </a>
                      )}
                    </div>
                  </div>
                  {tasker && tasker.reviews.length > 0 && (
                    <ul className="mini-reviews">
                      {tasker.reviews.slice(0, 3).map((r) => (
                        <li key={r.id}>
                          <Stars n={r.rating} /> <b>{r.reviewerName}</b>
                          <p>{r.comment}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {reviews.length > 0 && (
                <section className="card detail-card">
                  <h2>Đánh giá của đơn này</h2>
                  <ul className="mini-reviews">
                    {reviews.map((r) => (
                      <li key={r.id}>
                        <Stars n={r.rating} />{" "}
                        <b>
                          {r.reviewerName}
                          {r.reviewerId === b.taskerId ? " (Tasker)" : ""}
                        </b>
                        <p>{r.comment || "Không có nhận xét"}</p>
                        {r.reviewerId === b.taskerId &&
                          (r.isFlagged ? (
                            <span className="muted">
                              Đã báo cáo, chờ quản trị viên xử lý
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="link-teal"
                              onClick={() => report(r)}
                            >
                              Báo cáo đánh giá bất thường
                            </button>
                          ))}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {dispute && (
                <section className="card detail-card" id="khieu-nai">
                  <h2>Khiếu nại</h2>
                  <div className="kv-row">
                    <span>Trạng thái</span>
                    <b>
                      {dispute.status === 0
                        ? "Đang chờ quản trị viên xử lý"
                        : "Đã xử lý"}
                    </b>
                  </div>
                  <div className="kv-row">
                    <span>Lý do</span>
                    <b>{DISPUTE_REASONS[dispute.reason] ?? "Khác"}</b>
                  </div>
                  <p className="quote-box">{dispute.description}</p>
                  {dispute.taskerResponse && (
                    <>
                      <b className="sub-h">Phản hồi của Tasker</b>
                      <p className="quote-box">{dispute.taskerResponse}</p>
                    </>
                  )}
                  {dispute.status === 1 && (
                    <>
                      <div className="kv-row">
                        <span>Kết quả</span>
                        <b>
                          {dispute.resolution != null
                            ? DISPUTE_RESOLUTIONS[dispute.resolution]
                            : "—"}
                        </b>
                      </div>
                      {dispute.refundAmount ? (
                        <div className="kv-row">
                          <span>Số tiền hoàn</span>
                          <b>{formatVND(dispute.refundAmount)}</b>
                        </div>
                      ) : null}
                      {dispute.adminNote && (
                        <>
                          <b className="sub-h">Ghi chú của quản trị viên</b>
                          <p className="quote-box">{dispute.adminNote}</p>
                        </>
                      )}
                    </>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
