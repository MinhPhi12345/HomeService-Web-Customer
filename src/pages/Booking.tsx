// US12/US13/US21 - Tạo đơn (thời gian, địa chỉ, tọa độ) và thanh toán trước
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Map as MapIcon, MapPinCheck, Timer } from "lucide-react";
import Navbar from "../components/Navbar";
import { iconForService } from "../components/ServiceIcon";
import { serviceCatalog } from "../services/serviceCatalog";
import { bookingService, paymentService } from "../services/bookingService";
import { profileService } from "../services/userServices";
import { getErrorMessage, isDemo } from "../services/api";
import { FALLBACK_SERVICES } from "../data/fallbackServices";
import { BookingStatus, PaymentMethod, type ServiceCategory } from "../types";
import { formatPrice, formatVND } from "../utils/format";
import "../styles/landing.css";
import "../styles/app.css";

const TIMES = ["08:00", "09:00", "13:00", "15:00"];
const DEFAULT_PIN = { lat: 10.7743, lng: 106.7038 }; // Quận 1, TP.HCM (khi không lấy được GPS)
const WEEKDAY = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

function dayLabel(d: Date, i: number) {
  if (i === 0) return "Hôm nay";
  if (i === 1) return "Mai";
  return WEEKDAY[d.getDay()];
}

export default function Booking() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [services, setServices] =
    useState<ServiceCategory[]>(FALLBACK_SERVICES);
  const [serviceId, setServiceId] = useState<number>(
    Number(params.get("serviceId")) || 1,
  );
  const [quantity, setQuantity] = useState(() => {
    const q = Number(params.get("quantity"));
    return q >= 1 && q <= 12 ? q : 3;
  });
  const days = useMemo(
    () => Array.from({ length: 5 }, (_, i) => addDays(new Date(), i)),
    [],
  );
  const [date, setDate] = useState(ymd(addDays(new Date(), 1)));
  const [time, setTime] = useState("09:00");
  const [address, setAddress] = useState(params.get("address") ?? "");
  const [pin, setPin] = useState<{
    lat: number;
    lng: number;
    auto: boolean;
  } | null>(() => {
    const lat = Number(params.get("lat")),
      lng = Number(params.get("lng"));
    return params.get("lat") &&
      params.get("lng") &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
      ? { lat, lng, auto: true }
      : null;
  });
  const [note, setNote] = useState(params.get("note") ?? "");
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.EWallet);
  const [present, setPresent] = useState(false);
  const [cashOk, setCashOk] = useState(false);
  const [error, setError] = useState("");
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [payFailedId, setPayFailedId] = useState<number | null>(null);

  // Dịch vụ từ API (fallback dữ liệu mẫu khi Backend chưa chạy)
  useEffect(() => {
    serviceCatalog
      .list()
      .then((d) => {
        const active = d.filter((s) => s.isActive);
        if (active.length) {
          setServices(active);
          setServiceId((cur) =>
            active.some((s) => s.id === cur) ? cur : active[0].id,
          );
        }
      })
      .catch(() => undefined);
  }, []);

  // Điều kiện tiền mặt (BR-P06): ≥ 3 đơn hoàn tất, không nợ, không bị chặn tiền mặt (lấy từ GET /profile)
  useEffect(() => {
    Promise.all([bookingService.my(), profileService.get()])
      .then(([list, prof]) => {
        const paid = list.filter((b) => b.status === BookingStatus.Paid).length;
        setCashOk(
          paid >= 3 && !(prof.outstandingAmount ?? 0) && !prof.isCashBlocked,
        );
      })
      .catch(() => setCashOk(false));
  }, []);

  const service = services.find((s) => s.id === serviceId) ?? services[0];
  const total = service ? service.basePrice * quantity : 0;
  const cashAllowed = cashOk && total <= 1_000_000;
  const { Icon: ServiceIcon, bg: serviceBg } = iconForService(
    service?.name ?? "",
  );

  const scheduled = useMemo(() => {
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm);
  }, [date, time]);

  const timeDisabled = (t: string) => {
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = t.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm).getTime() < Date.now() + 3600_000;
  };

  const dayText = () => {
    const idx = days.findIndex((d) => ymd(d) === date);
    const [y, m, d] = date.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return idx >= 0 && idx < 2
      ? dayLabel(dt, idx)
      : `${WEEKDAY[dt.getDay()]} ${pad(d)}/${pad(m)}`;
  };
  const endTime = () => {
    if (service?.unit !== "giờ") return "";
    const e = new Date(scheduled.getTime() + quantity * 3600_000);
    return ` – ${pad(e.getHours())}:${pad(e.getMinutes())}`;
  };

  const pinMap = () => {
    if (!navigator.geolocation) return setPin({ ...DEFAULT_PIN, auto: false });
    navigator.geolocation.getCurrentPosition(
      (p) =>
        setPin({
          lat: +p.coords.latitude.toFixed(6),
          lng: +p.coords.longitude.toFixed(6),
          auto: true,
        }),
      () => setPin({ ...DEFAULT_PIN, auto: false }),
      { timeout: 8000 },
    );
  };

  const submit = async () => {
    const fe: Record<string, string> = {};
    const addr = address.trim();
    if (addr.length < 5 || addr.length > 255)
      fe.address = "Vui lòng nhập địa chỉ.";
    if (!pin) fe.pin = "Vui lòng ghim vị trí thực hiện trên bản đồ.";
    if (note.length > 500) fe.note = "Ghi chú tối đa 500 ký tự.";
    const t = scheduled.getTime();
    if (t < Date.now() + 3600_000 || t > Date.now() + 30 * 86400_000)
      fe.time = "Thời gian đặt không hợp lệ.";
    if (method === PaymentMethod.Cash && !present)
      fe.present = "Vui lòng cam kết có mặt khi Tasker hoàn thành.";
    setFieldErr(fe);
    setError("");
    if (Object.keys(fe).length || !service || !pin) return;

    if (isDemo()) {
      navigate("/bookings");
      return;
    } // xem thử: không gọi API

    setSubmitting(true);
    setPayFailedId(null);
    let createdId: number | null = null;
    try {
      const booking = await bookingService.create({
        serviceCategoryId: service.id,
        scheduledTime: scheduled.toISOString(), // UTC ISO 8601
        address: addr,
        latitude: pin.lat,
        longitude: pin.lng,
        note: note.trim() || null,
        quantity,
        paymentMethod: method,
        customerPresent: method === PaymentMethod.Cash ? present : false,
      });
      createdId = booking.id;
      if (method !== PaymentMethod.Cash)
        await paymentService.pay(booking.id, method);
      navigate(`/bookings/${booking.id}`);
    } catch (err) {
      if (createdId) setPayFailedId(createdId);
      setError(
        createdId
          ? `Đơn đã được tạo nhưng thanh toán chưa thành công: ${getErrorMessage(err)}`
          : getErrorMessage(err),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const unit = service?.unit ?? "giờ";
  const payOpts: {
    m: PaymentMethod;
    title: string;
    sub: string;
    disabled?: boolean;
  }[] = [
    { m: PaymentMethod.EWallet, title: "Ví điện tử", sub: "MoMo, ZaloPay…" },
    { m: PaymentMethod.Card, title: "Thẻ", sub: "Visa / Napas" },
    {
      m: PaymentMethod.Cash,
      title: "Tiền mặt",
      sub: cashAllowed
        ? "Tasker thu tiền khi hoàn thành"
        : "Cần ≥ 3 đơn hoàn tất",
      disabled: !cashAllowed,
    },
  ];

  return (
    <>
      <Navbar variant="app" />
      <main className="app-page">
        <div className="container booking-layout">
          <section className="card booking-form">
            <h1 className="page-title">Đặt dịch vụ</h1>

            <h2 className="step-label">1. Chọn dịch vụ</h2>
            <div className="chip-row" role="radiogroup" aria-label="Dịch vụ">
              {services.map((s) => {
                const { Icon } = iconForService(s.name);
                const on = s.id === serviceId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`chip${on ? " chip--on" : ""}`}
                    onClick={() => setServiceId(s.id)}
                  >
                    <Icon size={16} /> {s.name}
                  </button>
                );
              })}
            </div>

            <h2 className="step-label">2. Thời lượng</h2>
            <div className="stepper">
              <button
                type="button"
                aria-label="Giảm"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="stepper-val">
                {quantity} {unit}
              </span>
              <button
                type="button"
                aria-label="Tăng"
                disabled={quantity >= 12}
                onClick={() => setQuantity((q) => Math.min(12, q + 1))}
              >
                +
              </button>
            </div>

            <h2 className="step-label">3. Ngày &amp; giờ</h2>
            <div className="chip-row">
              {days.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  className={`chip${ymd(d) === date ? " chip--on" : ""}`}
                  onClick={() => setDate(ymd(d))}
                >
                  {dayLabel(d, i)}
                </button>
              ))}
              <label className="chip chip--input">
                <input
                  type="date"
                  aria-label="Chọn ngày khác"
                  min={ymd(new Date())}
                  max={ymd(addDays(new Date(), 30))}
                  value={date}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                />
              </label>
            </div>
            <div className="chip-row">
              {TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={timeDisabled(t)}
                  className={`chip${t === time ? " chip--on" : ""}`}
                  onClick={() => setTime(t)}
                >
                  {t}
                </button>
              ))}
              <label className="chip chip--input">
                <input
                  type="time"
                  aria-label="Chọn giờ khác"
                  value={time}
                  onChange={(e) => e.target.value && setTime(e.target.value)}
                />
              </label>
            </div>
            {fieldErr.time && (
              <span className="field-error">{fieldErr.time}</span>
            )}

            <h2 className="step-label">4. Địa chỉ</h2>
            <div className="field">
              <input
                type="text"
                placeholder="12 Nguyễn Huệ, Quận 1, TP.HCM"
                aria-label="Địa chỉ"
                maxLength={255}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                aria-invalid={!!fieldErr.address}
              />
              {fieldErr.address && (
                <span className="field-error">{fieldErr.address}</span>
              )}
            </div>
            <button
              type="button"
              className={`map-box${pin ? " map-box--pinned" : ""}`}
              onClick={pinMap}
            >
              {pin ? (
                <MapPinCheck size={29} color="#0f9b8e" />
              ) : (
                <MapIcon size={29} color="#0f9b8e" />
              )}
              <span>
                {pin
                  ? `Đã ghim vị trí: ${pin.lat}, ${pin.lng}${pin.auto ? "" : " (vị trí mặc định Quận 1)"}`
                  : "Ghim vị trí thực hiện trên bản đồ"}
              </span>
            </button>
            {fieldErr.pin && (
              <span className="field-error">{fieldErr.pin}</span>
            )}

            <h2 className="step-label">5. Ghi chú cho Tasker</h2>
            <div className="field">
              <input
                type="text"
                placeholder="Nhà có nuôi mèo…"
                aria-label="Ghi chú"
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              {fieldErr.note && (
                <span className="field-error">{fieldErr.note}</span>
              )}
            </div>

            <h2 className="step-label">6. Thanh toán</h2>
            <div
              className="pay-row"
              role="radiogroup"
              aria-label="Phương thức thanh toán"
            >
              {payOpts.map((o) => (
                <button
                  key={o.m}
                  type="button"
                  role="radio"
                  aria-checked={method === o.m}
                  disabled={o.disabled}
                  className={`pay-opt${method === o.m ? " pay-opt--on" : ""}`}
                  onClick={() => setMethod(o.m)}
                >
                  <b>
                    {method === o.m ? "◉" : "○"}&nbsp; {o.title}
                  </b>
                  <span>{o.sub}</span>
                </button>
              ))}
            </div>
            {method === PaymentMethod.Cash && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={present}
                  onChange={(e) => setPresent(e.target.checked)}
                />
                Tôi cam kết có mặt khi Tasker hoàn thành công việc
              </label>
            )}
            {fieldErr.present && (
              <span className="field-error">{fieldErr.present}</span>
            )}
          </section>

          <aside className="card summary">
            <h2 className="summary-title">Tóm tắt đơn</h2>
            <div className="summary-service">
              <span className="summary-icon" style={{ background: serviceBg }}>
                <ServiceIcon size={25} color="#0f9b8e" />
              </span>
              <div>
                <b>{service?.name}</b>
                <span>
                  {dayText()}, {time}
                  {endTime()} · {quantity} {unit}
                </span>
              </div>
            </div>
            <div className="summary-line">
              <span>Đơn giá</span>
              <b>
                {service ? formatPrice(service.basePrice, service.unit) : "—"}
              </b>
            </div>
            <div className="summary-line">
              <span>Số lượng</span>
              <b>
                × {quantity} {unit}
              </b>
            </div>
            <hr />
            <div className="summary-total">
              <span>Tổng thanh toán</span>
              <b>{formatVND(total)}</b>
            </div>
            <div className="summary-safe">
              <Lock size={17} color="#0f9b8e" />
              <span>
                Tiền được tạm giữ an toàn, chỉ chuyển cho Tasker khi bạn xác
                nhận hoàn thành.
              </span>
            </div>
            {error && (
              <div className="form-error" role="alert">
                {error}
                {payFailedId && (
                  <>
                    {" "}
                    <Link to={`/bookings/${payFailedId}`} className="link-teal">
                      Xem đơn để thanh toán lại
                    </Link>
                  </>
                )}
              </div>
            )}
            <button
              type="button"
              className="auth-submit"
              onClick={submit}
              disabled={submitting}
            >
              {submitting
                ? "Đang xử lý…"
                : method === PaymentMethod.Cash
                  ? "Đặt đơn & tìm Tasker"
                  : "Thanh toán & tìm Tasker"}
            </button>
            {method !== PaymentMethod.Cash && (
              <p className="summary-timer">
                <Timer size={14} /> Hoàn tất thanh toán trong 15 phút
              </p>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
