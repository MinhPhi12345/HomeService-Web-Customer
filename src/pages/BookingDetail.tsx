// US19/US25/US34–US37 – Chi tiết đơn: tiến độ, theo dõi Tasker, xác nhận, khiếu nại, đánh giá, trả nợ
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Camera, Clock, Flag, Phone, RefreshCw, Star } from "lucide-react";
import AppShell from "../components/AppShell";
import OrderActions from "../components/OrderActions";
import MapView from "../components/MapView";
import { Toast } from "../components/Modal";
import { iconForService } from "../components/ServiceIcon";
import { useNow } from "../hooks/useNow";
import { bookingService, disputeService, reviewService } from "../services/bookingService";
import { getErrorMessage } from "../services/api";
import type { BookingResponse, DisputeDetail, LocationResponse, ReviewItem, UserReviews } from "../types";
import { formatDateTime, formatPhone, formatTime, formatVND, initials } from "../utils/format";
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

const STEPS = ["Đã đặt", "Tìm Tasker", "Tasker nhận", "Đang làm", "Hoàn thành", "Đã thanh toán"];
const STEP_OF: Record<number, number> = { 10: 0, 0: 1, 1: 1, 8: 1, 2: 2, 3: 3, 4: 4, 11: 4, 13: 4, 5: 5 };
const LIVE = [0, 1, 2, 3, 10];

const Stars = ({ n, size = 14 }: { n: number; size?: number }) => (
  <span className="stars" aria-label={`${n} sao`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={size}
        fill={i <= Math.round(n) ? "#ffb938" : "none"}
        color={i <= Math.round(n) ? "#ffb938" : "#c5d1d5"}
      />
    ))}
  </span>
);

export default function BookingDetail() {
  const { id } = useParams();
  const bookingId = Number(id);
  const location = useLocation();
  const navigate = useNavigate();
  const now = useNow();
  const [b, setB] = useState<BookingResponse | null>(null);
  const [error, setError] = useState("");
  const [tasker, setTasker] = useState<UserReviews | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [loc, setLoc] = useState<LocationResponse | null>(null);
  const [locMsg, setLocMsg] = useState("");
  const [toast, setToast] = useState((location.state as { toast?: string } | null)?.toast ?? "");
  const closeToast = useCallback(() => setToast(""), []);

  // Xóa toast khỏi history để F5 không hiện lại
  useEffect(() => {
    if ((location.state as { toast?: string } | null)?.toast)
      navigate(location.pathname + location.hash, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setError("");
      try {
        setB(await bookingService.get(bookingId));
      } catch (e) {
        if (!silent)
          setError(
            axios.isAxiosError(e) && (e.response?.status === 404 || e.response?.status === 403)
              ? "Không tìm thấy đơn này trong tài khoản của bạn."
              : getErrorMessage(e),
          );
      }
    },
    [bookingId],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!b || !LIVE.includes(b.status)) return;
    const t = setInterval(() => load(true), 10_000);
    return () => clearInterval(t);
  }, [b, load]);

  useEffect(() => {
    if (!b?.taskerId) return setTasker(null);
    reviewService.forUser(b.taskerId).then(setTasker).catch(() => setTasker(null));
  }, [b?.taskerId]);

  useEffect(() => {
    if (!b) return;
    reviewService.forBooking(b.id).then(setReviews).catch(() => setReviews([]));
  }, [b?.id, b?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!b?.disputeId) return setDispute(null);
    disputeService.get(b.disputeId).then(setDispute).catch(() => setDispute(null));
  }, [b?.disputeId, b?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (location.hash === "#khieu-nai" && dispute)
      document.getElementById("khieu-nai")?.scrollIntoView({ behavior: "smooth" });
  }, [location.hash, dispute]);

  // Vị trí Tasker mỗi 10 giây khi đơn ở trạng thái 2 hoặc 3
  const tracking = b?.status === 2 || b?.status === 3;
  useEffect(() => {
    if (!b || !tracking) {
      setLoc(null);
      setLocMsg("");
      return;
    }
    let stop = false;
    const tick = () =>
      bookingService
        .location(b.id)
        .then((r) => {
          if (!stop) {
            setLoc(r);
            setLocMsg("");
          }
        })
        .catch((e) => {
          if (stop) return;
          setLoc(null);
          setLocMsg(
            axios.isAxiosError(e) && e.response?.status === 404
              ? "Tasker chưa chia sẻ vị trí. Bản đồ sẽ cập nhật khi Tasker mở ứng dụng."
              : getErrorMessage(e),
          );
        });
    tick();
    const t = setInterval(tick, 10_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [b?.id, tracking]); // eslint-disable-line react-hooks/exhaustive-deps

  const report = async (r: ReviewItem) => {
    try {
      await reviewService.report(r.id);
      setToast("Đã gửi báo cáo đánh giá cho quản trị viên.");
      setReviews((l) => l.map((x) => (x.id === r.id ? { ...x, isFlagged: true } : x)));
    } catch (e) {
      setToast(getErrorMessage(e));
    }
  };

  if (error)
    return (
      <AppShell narrow>
        <Link to="/bookings" className="back">
          <ArrowLeft size={16} /> Đơn của tôi
        </Link>
        <div className="notice notice--danger" role="alert">
          {error}
          <button type="button" className="link notice-action" onClick={() => load()}>
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      </AppShell>
    );
  if (!b)
    return (
      <AppShell>
        <div className="skeleton" style={{ height: 160, marginBottom: 16 }} />
        <div className="detail-grid">
          <div className="skeleton" style={{ height: 320 }} />
          <div className="skeleton" style={{ height: 220 }} />
        </div>
      </AppShell>
    );

  const meta = STATUS_META[b.status] ?? { label: `Trạng thái ${b.status}`, tone: "gray" as const };
  const { Icon, bg, fg } = iconForService(b.serviceCategoryName);
  const step = STEP_OF[b.status];
  const home = b.latitude != null && b.longitude != null ? { lat: b.latitude, lng: b.longitude } : null;
  const phone = b.contactPhone ?? b.customerPhone;

  const rows: [string, string][] = [
    ["Dịch vụ", b.serviceCategoryName],
    ...(b.quantity ? ([["Số lượng", String(b.quantity)]] as [string, string][]) : []),
    ["Giờ hẹn", formatDateTime(b.scheduledTime)],
    ["Địa chỉ", b.address],
    ...(phone ? ([["SĐT liên hệ", formatPhone(phone)]] as [string, string][]) : []),
    ...(b.note ? ([["Ghi chú", b.note]] as [string, string][]) : []),
    [
      "Thanh toán",
      `${METHOD_LABEL[b.paymentMethod] ?? "—"}${b.paymentStatus != null ? ` · ${PAYMENT_STATUS_LABEL[b.paymentStatus] ?? ""}` : ""}`,
    ],
    ...((b.cancellationFee ?? 0) > 0 ? ([["Phí hủy", formatVND(b.cancellationFee!)]] as [string, string][]) : []),
    ["Ngày tạo", formatDateTime(b.createdAt)],
  ];

  return (
    <AppShell>
      <Link to="/bookings" className="back">
        <ArrowLeft size={16} /> Đơn của tôi
      </Link>

      <section className="panel detail-head">
        <div className="dh-top">
          <span className="svc-icon svc-icon--lg" style={{ background: bg, color: fg }}>
            <Icon size={26} />
          </span>
          <div className="dh-title">
            <h1>{b.serviceCategoryName}</h1>
            <span className="muted">Đơn #{orderCode(b.id)}</span>
          </div>
          <div className="dh-price">
            <strong>{formatVND(b.totalPrice)}</strong>
            <span className={`badge badge--${meta.tone}`}>{meta.label}</span>
          </div>
        </div>
        <p className="dh-desc">{describe(b, now)}</p>
        {b.status === 10 && b.paymentDueAt && (
          <div className="notice notice--warn">
            <Clock size={18} />
            <span>
              Còn <b className="mono-num">{countdown(b.paymentDueAt, now)}</b> để thanh toán. Quá hạn đơn sẽ tự hủy.
            </span>
          </div>
        )}
        {b.status === 4 && b.autoConfirmAt && (
          <div className="notice notice--warn">
            <Clock size={18} />
            <span>
              Tự xác nhận hoàn thành sau <b className="mono-num">{countdown(b.autoConfirmAt, now)}</b>. Xem ảnh
              trước/sau rồi xác nhận hoặc gửi khiếu nại.
            </span>
          </div>
        )}
        {step !== undefined && (
          <ol className="progress" aria-label="Tiến độ đơn">
            {STEPS.map((s, i) => (
              <li key={s} className={i < step ? "done" : i === step ? "now" : ""} aria-current={i === step ? "step" : undefined}>
                <i />
                <span>{s}</span>
              </li>
            ))}
          </ol>
        )}
        <div className="dh-actions">
          <OrderActions
            booking={b}
            inDetail
            onChanged={(m) => {
              setToast(m);
              load(true);
            }}
          />
        </div>
      </section>

      <div className="detail-grid">
        <div>
          {tracking && (
            <section className="panel">
              <h2 className="panel-title">Vị trí Tasker</h2>
              {home ? (
                <MapView
                  home={home}
                  tasker={loc ? { lat: loc.latitude, lng: loc.longitude } : null}
                  height={320}
                  label="Bản đồ vị trí Tasker"
                />
              ) : (
                <p className="muted">Đơn chưa có tọa độ để hiển thị bản đồ.</p>
              )}
              <p className="hint map-caption">
                {loc
                  ? `Cập nhật lúc ${formatTime(loc.updatedAt)}${loc.distanceKm != null ? ` · cách nhà bạn khoảng ${loc.distanceKm} km` : ""}. Tự làm mới mỗi 10 giây.`
                  : locMsg || "Đang tải vị trí…"}
              </p>
            </section>
          )}

          <section className="panel">
            <h2 className="panel-title">Thông tin đơn</h2>
            {rows.map(([k, v]) => (
              <div className="kv" key={k}>
                <span>{k}</span>
                <b>{v}</b>
              </div>
            ))}
          </section>

          {(b.checkInPhotoUrl || b.checkOutPhotoUrl) && (
            <section className="panel">
              <h2 className="panel-title">Ảnh trước và sau khi làm</h2>
              <div className="photo-pair">
                {(
                  [
                    ["Trước khi làm", b.checkInPhotoUrl],
                    ["Sau khi làm", b.checkOutPhotoUrl],
                  ] as const
                ).map(([label, url]) => (
                  <figure key={label}>
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt={label} />
                      </a>
                    ) : (
                      <div className="photo-ph">
                        <Camera size={24} />
                        <span>Chưa có ảnh</span>
                      </div>
                    )}
                    <figcaption>{label}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
        </div>

        <div>
          {b.taskerId ? (
            <section className="panel">
              <h2 className="panel-title">Tasker phụ trách</h2>
              <div className="tasker-row">
                <span className="avatar avatar--lg">{initials(b.taskerName)}</span>
                <div className="tasker-info">
                  <b>{b.taskerName}</b>
                  {tasker && (
                    <span className="rating">
                      {tasker.ratingAverage != null ? (
                        <>
                          <Stars n={tasker.ratingAverage} /> {tasker.ratingAverage.toFixed(1)} · {tasker.reviewCount} đánh giá
                        </>
                      ) : (
                        "Chưa có đánh giá"
                      )}
                    </span>
                  )}
                </div>
              </div>
              {b.taskerPhone && (
                <a className="btn btn-outline btn-block tasker-call" href={`tel:${b.taskerPhone}`}>
                  <Phone size={17} /> Gọi {formatPhone(b.taskerPhone)}
                </a>
              )}
              {tasker && tasker.reviews.length > 0 && (
                <ul className="reviews">
                  {tasker.reviews.slice(0, 3).map((r) => (
                    <li key={r.id}>
                      <div>
                        <b>{r.reviewerName}</b> <Stars n={r.rating} size={12} />
                      </div>
                      {r.comment && <p>{r.comment}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            [0, 1, 8, 10].includes(b.status) && (
              <section className="panel finding">
                <span className="finding-pulse" aria-hidden="true" />
                <div>
                  <b>{b.status === 10 ? "Chờ thanh toán" : b.status === 8 ? "Chưa có Tasker nhận" : "Đang tìm Tasker"}</b>
                  <p className="hint">
                    {b.status === 8
                      ? "Bạn có thể thử lại, đổi giờ hẹn hoặc hủy đơn."
                      : b.status === 10
                        ? "Sau khi thanh toán, lời mời sẽ được gửi tới Tasker gần bạn."
                        : "Lời mời đang gửi lần lượt tới Tasker trong bán kính 3, 5 rồi 8 km."}
                  </p>
                </div>
              </section>
            )
          )}

          {reviews.length > 0 && (
            <section className="panel">
              <h2 className="panel-title">Đánh giá của đơn này</h2>
              <ul className="reviews">
                {reviews.map((r) => (
                  <li key={r.id}>
                    <div>
                      <b>
                        {r.reviewerName}
                        {r.reviewerId === b.taskerId ? " (Tasker)" : " (Bạn)"}
                      </b>{" "}
                      <Stars n={r.rating} size={12} />
                    </div>
                    <p>{r.comment || "Không có nhận xét"}</p>
                    {r.reviewerId === b.taskerId &&
                      (r.isFlagged ? (
                        <span className="hint">Đã báo cáo, chờ quản trị viên xử lý</span>
                      ) : (
                        <button type="button" className="link small" onClick={() => report(r)}>
                          <Flag size={13} /> Báo cáo đánh giá không phù hợp
                        </button>
                      ))}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {dispute && (
            <section className="panel" id="khieu-nai">
              <h2 className="panel-title">
                Khiếu nại
                <span className={`badge ${dispute.status === 0 ? "badge--amber" : "badge--green"}`}>
                  {dispute.status === 0 ? "Đang xử lý" : "Đã xử lý"}
                </span>
              </h2>
              <div className="kv">
                <span>Lý do</span>
                <b>{DISPUTE_REASONS[dispute.reason] ?? "Khác"}</b>
              </div>
              <p className="quote">{dispute.description}</p>
              {dispute.evidenceUrls.length > 0 && (
                <div className="thumbs">
                  {dispute.evidenceUrls.map((u) => (
                    <a key={u} href={u} target="_blank" rel="noreferrer">
                      <img src={u} alt="Ảnh bằng chứng" />
                    </a>
                  ))}
                </div>
              )}
              {dispute.taskerResponse && (
                <>
                  <b className="sub-h">Phản hồi của Tasker</b>
                  <p className="quote">{dispute.taskerResponse}</p>
                </>
              )}
              {dispute.status === 1 && (
                <>
                  <div className="kv">
                    <span>Kết quả</span>
                    <b>{dispute.resolution != null ? DISPUTE_RESOLUTIONS[dispute.resolution] : "—"}</b>
                  </div>
                  {dispute.refundAmount ? (
                    <div className="kv">
                      <span>Số tiền hoàn</span>
                      <b>{formatVND(dispute.refundAmount)}</b>
                    </div>
                  ) : null}
                  {dispute.adminNote && (
                    <>
                      <b className="sub-h">Ghi chú của quản trị viên</b>
                      <p className="quote">{dispute.adminNote}</p>
                    </>
                  )}
                </>
              )}
            </section>
          )}
        </div>
      </div>
      <Toast message={toast} onClose={closeToast} />
    </AppShell>
  );
}
