// US19/US25/US34–US37 – Chi tiết đơn: tiến độ, theo dõi Tasker, xác nhận, khiếu nại, đánh giá, trả nợ
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Camera, Flag, Phone, RefreshCw, Star, Trophy, UserRound } from "lucide-react";
import AppShell from "../components/AppShell";
import OrderActions from "../components/OrderActions";
import { ReportReviewDialog } from "../components/OrderDialogs";
import ProfileDialog from "../components/ProfileDialog";
import PaymentStatusPanel from "../components/PaymentStatusPanel";
import MapView from "../components/MapView";
import { Toast } from "../components/Modal";
import ServiceBadge from "../components/ServiceBadge";
import { useServiceIcons } from "../components/useServiceIcons";
import { mediaUrl } from "../utils/media";
import BookingPhotoCompare from "../components/BookingPhotoCompare";
import { durationText } from "../utils/service";
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
  describe,
  orderCode,
  payable,
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
  const icons = useServiceIcons();
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
  const [openPay] = useState(Boolean((location.state as { openPay?: boolean } | null)?.openPay));
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

  const [reporting, setReporting] = useState<ReviewItem | null>(null);
  const [profileOf, setProfileOf] = useState<number | null>(null);
  const reported = (r: ReviewItem, reason: string) => {
    setReporting(null);
    setToast("Đã gửi báo cáo kèm lý do cho quản trị viên.");
    setReviews((l) =>
      l.map((x) =>
        x.id === r.id ? { ...x, isFlagged: true, reportReason: reason, reportedAt: new Date().toISOString() } : x,
      ),
    );
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
  const step = STEP_OF[b.status];
  const home = b.latitude != null && b.longitude != null ? { lat: b.latitude, lng: b.longitude } : null;
  const phone = b.contactPhone ?? b.customerPhone;

  const items = b.items ?? [];
  const photos = b.photos ?? [];
  const rows: [string, string][] = [
    ["Dịch vụ", b.serviceCategoryName],
    ...(b.quantity ? ([["Số lượng", `${b.quantity}${b.serviceUnit ? ` ${b.serviceUnit}` : ""}`]] as [string, string][]) : []),
    ["Giờ hẹn", formatDateTime(b.scheduledTime)],
    ...(b.estimatedMinutes ? ([["Thời lượng dự kiến", durationText(b.estimatedMinutes)]] as [string, string][]) : []),
    ["Địa chỉ", b.address],
    ...(phone ? ([["SĐT liên hệ", formatPhone(phone)]] as [string, string][]) : []),
    ...(b.note ? ([["Ghi chú", b.note]] as [string, string][]) : []),
    [
      "Thanh toán",
      `${METHOD_LABEL[b.paymentMethod] ?? "—"}${b.paymentStatus != null ? ` · ${PAYMENT_STATUS_LABEL[b.paymentStatus] ?? ""}` : ""}`,
    ],
    ...((b.discountAmount ?? 0) > 0
      ? ([
          ["Giá dịch vụ", formatVND(b.totalPrice)],
          [`Mã giảm giá${b.voucherCode ? ` ${b.voucherCode}` : ""}`, `−${formatVND(b.discountAmount!)}`],
          ["Bạn trả", formatVND(payable(b))],
        ] as [string, string][])
      : []),
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
          <ServiceBadge name={b.serviceCategoryName} iconUrl={icons[b.serviceCategoryId ?? 0]} size={26} className="svc-icon svc-icon--lg" />
          <div className="dh-title">
            <h1>{b.serviceCategoryName}</h1>
            <span className="muted">Đơn #{orderCode(b.id)}</span>
          </div>
          <div className="dh-price">
            {(b.discountAmount ?? 0) > 0 && <s className="price-old">{formatVND(b.totalPrice)}</s>}
            <strong>{formatVND(payable(b))}</strong>
            <span className={`badge badge--${meta.tone}`}>{meta.label}</span>
          </div>
        </div>
        <p className="dh-desc">{describe(b, now)}</p>
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
            openPayOnLoad={openPay}
            onChanged={(m) => {
              setToast(m);
              load(true);
            }}
          />
        </div>
      </section>

      <PaymentStatusPanel booking={b} now={now} />

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

          {items.length > 0 && photos.length === 0 && (
            <section className="panel">
              <h2 className="panel-title">Hạng mục cần làm ({items.length})</h2>
              <ol className="dt-items">
                {items.map((it) => (
                  <li key={it.itemNo}>
                    <span className="pc-no">{it.itemNo}</span>
                    <span>{it.description}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {photos.length > 0 ? (
            <section className="panel">
              <h2 className="panel-title">{items.length > 0 ? `Hạng mục & ảnh trước / sau (${items.length})` : "Ảnh trước và sau khi làm"}</h2>
              <BookingPhotoCompare items={items} photos={photos} />
            </section>
          ) : (b.checkInPhotoUrl || b.checkOutPhotoUrl) && (
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
                      <a href={mediaUrl(url)} target="_blank" rel="noreferrer">
                        <img src={mediaUrl(url)} alt={label} />
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
                  {b.taskerBadges && b.taskerBadges.length > 0 && (
                    <span className="award-badge" title={b.taskerBadges.join(" · ")}>
                      <Trophy size={13} /> {b.taskerBadges[0]}
                      {b.taskerBadges.length > 1 ? ` (+${b.taskerBadges.length - 1})` : ""}
                    </span>
                  )}
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
              <button type="button" className="btn btn-outline btn-block tasker-profile-btn" onClick={() => setProfileOf(b.taskerId)}>
                <UserRound size={17} /> Xem hồ sơ & đánh giá
              </button>
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
                        <div className="review-report">
                          <b>Đã báo cáo, chờ quản trị viên xử lý.</b>
                          {r.reportReason && <span>Lý do của bạn: {r.reportReason}</span>}
                        </div>
                      ) : r.moderatedAt ? (
                        <div className="review-report review-report--kept">
                          <b>Quản trị viên đã xem xét và giữ lại đánh giá này.</b>
                          {r.moderationNote && <span>Lý do: {r.moderationNote}</span>}
                        </div>
                      ) : (
                        <button type="button" className="link small" onClick={() => setReporting(r)}>
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
                    <a key={u} href={mediaUrl(u)} target="_blank" rel="noreferrer">
                      <img src={mediaUrl(u)} alt="Ảnh bằng chứng" />
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
      {profileOf != null && <ProfileDialog userId={profileOf} onClose={() => setProfileOf(null)} />}
      {reporting && (
        <ReportReviewDialog review={reporting} onClose={() => setReporting(null)} onDone={(reason) => reported(reporting, reason)} />
      )}
      <Toast message={toast} onClose={closeToast} />
    </AppShell>
  );
}
