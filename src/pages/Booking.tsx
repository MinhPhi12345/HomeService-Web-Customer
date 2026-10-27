// US12/US13/US21 – Tạo đơn: dịch vụ, thời gian, địa chỉ trên bản đồ, SĐT liên hệ, thanh toán trước
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Clock,
  CreditCard,
  Crosshair,
  Info,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Phone,
  Plus,
  Search,
  UserRound,
  Wallet,
  Banknote,
} from "lucide-react";
import AppShell from "../components/AppShell";
import MapView, { type LatLng } from "../components/MapView";
import ServiceBadge from "../components/ServiceBadge";
import { useServices } from "../hooks/useServices";
import { bookingService, paymentService } from "../services/bookingService";
import { profileService } from "../services/userServices";
import { currentPosition, geoService, type GeoPlace } from "../services/geoService";
import { getErrorMessage } from "../services/api";
import { BookingStatus, PaymentMethod, type ProfileResponse } from "../types";
import { formatPhone, formatVND } from "../utils/format";
import { validatePhone } from "../utils/validators";

const DEFAULT_CENTER: LatLng = { lat: 10.7769, lng: 106.7009 }; // Quận 1, TP.HCM
const TIMES = ["07:00", "08:00", "09:00", "10:00", "13:00", "14:00", "15:00", "16:00", "18:00"];
const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const CASH_MIN_PAID = 3;
const CASH_MAX = 1_000_000;

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const toDate = (date: string, time: string) => {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm);
};

type Errors = Partial<Record<"service" | "time" | "address" | "pin" | "phone" | "note" | "present", string>>;

export default function Booking() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { services, error: svcError, reload } = useServices();

  // ---- Dịch vụ & số lượng
  const [serviceId, setServiceId] = useState<number | null>(Number(params.get("serviceId")) || null);
  const [quantity, setQuantity] = useState(() => {
    const q = Number(params.get("quantity"));
    return q >= 1 && q <= 12 ? q : 2;
  });
  useEffect(() => {
    if (services?.length && !services.some((s) => s.id === serviceId))
      setServiceId((services.find((s) => s.unit === "giờ") ?? services[0]).id);
  }, [services, serviceId]);
  const service = services?.find((s) => s.id === serviceId) ?? null;
  const total = service ? service.basePrice * quantity : 0;
  const unit = service?.unit ?? "giờ";

  // ---- Thời gian
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)), []);
  const [date, setDate] = useState(ymd(addDays(new Date(), 1)));
  const [time, setTime] = useState("09:00");
  const scheduled = useMemo(() => toDate(date, time), [date, time]);
  const tooSoon = (t: string) => toDate(date, t).getTime() < Date.now() + 3600_000;

  // ---- Hồ sơ (gợi ý SĐT, địa chỉ, điều kiện tiền mặt)
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [paidCount, setPaidCount] = useState(0);

  // ---- Địa chỉ & bản đồ
  const qLat = Number(params.get("lat"));
  const qLng = Number(params.get("lng"));
  const fromQuery = params.get("lat") && params.get("lng") && Number.isFinite(qLat) && Number.isFinite(qLng);
  const [address, setAddress] = useState(params.get("address") ?? "");
  const [pin, setPin] = useState<LatLng>(fromQuery ? { lat: qLat, lng: qLng } : DEFAULT_CENTER);
  const [pinned, setPinned] = useState(!!fromQuery);
  const [locating, setLocating] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");
  const [results, setResults] = useState<GeoPlace[] | null>(null);
  const [searching, setSearching] = useState(false);
  const addressTouched = useRef(!!params.get("address"));

  // ---- Liên hệ, ghi chú, thanh toán
  const [phone, setPhone] = useState("");
  const [savePhone, setSavePhone] = useState(true);
  const [saveAddress, setSaveAddress] = useState(true);
  const [note, setNote] = useState(params.get("note") ?? "");
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.EWallet);
  const [present, setPresent] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [payFailedId, setPayFailedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Ghim vị trí mới => tự điền địa chỉ theo bản đồ */
  const pick = useCallback(async (p: LatLng, fillAddress = true) => {
    setPin(p);
    setPinned(true);
    setGeoMsg("");
    setErrors((e) => ({ ...e, pin: undefined }));
    if (!fillAddress) return;
    setResolving(true);
    const a = await geoService.reverse(p.lat, p.lng);
    setResolving(false);
    if (a) {
      setAddress(a);
      setErrors((e) => ({ ...e, address: undefined }));
    } else setGeoMsg("Chưa đọc được địa chỉ của điểm này, bạn nhập tay số nhà và tên đường nhé.");
  }, []);

  const locateMe = useCallback(
    async (silent = false) => {
      setLocating(true);
      setGeoMsg("");
      try {
        await pick(await currentPosition());
      } catch (e) {
        if (!silent) setGeoMsg((e as Error).message);
      } finally {
        setLocating(false);
      }
    },
    [pick],
  );

  const runSearch = async (q = address) => {
    if (q.trim().length < 3) {
      setErrors((e) => ({ ...e, address: "Nhập ít nhất 3 ký tự để tìm địa chỉ." }));
      return;
    }
    setSearching(true);
    setGeoMsg("");
    try {
      const list = await geoService.search(q.trim());
      setResults(list);
      if (!list.length) setGeoMsg("Không tìm thấy địa chỉ này. Thử thêm tên phường/quận hoặc ghim trực tiếp trên bản đồ.");
    } catch (e) {
      setResults(null);
      setGeoMsg(e instanceof Error && !("isAxiosError" in e) ? e.message : getErrorMessage(e));
    } finally {
      setSearching(false);
    }
  };

  const choosePlace = (p: GeoPlace) => {
    setResults(null);
    setAddress(p.address);
    addressTouched.current = true;
    pick({ lat: p.latitude, lng: p.longitude }, false);
  };

  // Tải hồ sơ: gợi ý SĐT + địa chỉ; nếu không có địa chỉ thì thử lấy GPS
  useEffect(() => {
    let stop = false;
    Promise.all([profileService.get(), bookingService.my({ status: [BookingStatus.Paid] })])
      .then(async ([p, paid]) => {
        if (stop) return;
        setProfile(p);
        setPaidCount(paid.length);
        if (p.phoneNumber) setPhone((cur) => cur || p.phoneNumber!);
        if (fromQuery) return;
        if (p.address && !addressTouched.current) {
          setAddress(p.address);
          const found = await geoService.search(p.address).catch(() => []);
          if (!stop && found[0]) pick({ lat: found[0].latitude, lng: found[0].longitude }, false);
        } else if (!addressTouched.current) locateMe(true);
      })
      .catch(() => {
        if (!stop && !fromQuery) locateMe(true);
      });
    return () => {
      stop = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Điều kiện tiền mặt (BR-P06)
  const debt = profile?.outstandingAmount ?? 0;
  const cashReason = !profile
    ? "Đang kiểm tra điều kiện"
    : profile.isCashBlocked
      ? "Tài khoản đang bị khóa thanh toán tiền mặt"
      : debt > 0
        ? "Bạn còn khoản chưa thanh toán"
        : paidCount < CASH_MIN_PAID
          ? `Cần ít nhất ${CASH_MIN_PAID} đơn hoàn tất (bạn có ${paidCount})`
          : total > CASH_MAX
            ? `Chỉ áp dụng cho đơn đến ${formatVND(CASH_MAX)}`
            : "";
  const cashAllowed = !cashReason;
  useEffect(() => {
    if (!cashAllowed && method === PaymentMethod.Cash) setMethod(PaymentMethod.EWallet);
  }, [cashAllowed, method]);

  const endText = () => {
    if (unit !== "giờ") return "";
    const e = new Date(scheduled.getTime() + quantity * 3600_000);
    return `–${pad(e.getHours())}:${pad(e.getMinutes())}`;
  };
  const dayText = () => {
    const d = scheduled;
    const i = days.findIndex((x) => ymd(x) === date);
    const prefix = i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : WEEKDAY[d.getDay()];
    return `${prefix}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  };

  const profilePhone = profile?.phoneNumber ?? "";
  const profileAddress = profile?.address ?? "";
  const canSavePhone = !!phone && phone !== profilePhone;
  const canSaveAddress = !profileAddress && address.trim().length >= 5;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const addr = address.trim();
    const t = scheduled.getTime();
    const next: Errors = {
      service: service ? "" : "Vui lòng chọn dịch vụ.",
      time:
        t < Date.now() + 3600_000
          ? "Giờ hẹn phải sau thời điểm hiện tại ít nhất 1 giờ."
          : t > Date.now() + 30 * 86400_000
            ? "Chỉ đặt trước tối đa 30 ngày."
            : "",
      address: addr.length < 5 ? "Vui lòng nhập địa chỉ (ít nhất 5 ký tự)." : addr.length > 255 ? "Địa chỉ tối đa 255 ký tự." : "",
      pin: pinned ? "" : "Ghim vị trí trên bản đồ để Tasker tìm đúng nhà.",
      phone: !phone ? "Vui lòng nhập số điện thoại để Tasker liên hệ." : validatePhone(phone),
      note: note.length > 500 ? "Ghi chú tối đa 500 ký tự." : "",
      present: method === PaymentMethod.Cash && !present ? "Vui lòng cam kết có mặt khi Tasker hoàn thành." : "",
    };
    setErrors(next);
    setServerError("");
    if (Object.values(next).some(Boolean) || !service) {
      document.querySelector("[aria-invalid='true'], .field-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    setPayFailedId(null);
    let createdId: number | null = null;
    try {
      const booking = await bookingService.create({
        serviceCategoryId: service.id,
        scheduledTime: scheduled.toISOString(),
        address: addr,
        latitude: pin.lat,
        longitude: pin.lng,
        note: note.trim() || null,
        quantity,
        paymentMethod: method,
        customerPresent: method === PaymentMethod.Cash ? present : false,
        contactPhone: phone,
      });
      createdId = booking.id;

      // Lưu SĐT / địa chỉ vào hồ sơ nếu khách chọn (PUT phải gửi đủ 4 field)
      if (profile && ((savePhone && canSavePhone) || (saveAddress && canSaveAddress))) {
        profileService
          .update({
            fullName: profile.fullName,
            phoneNumber: savePhone && canSavePhone ? phone : profile.phoneNumber,
            address: saveAddress && canSaveAddress ? addr : profile.address,
            avatarUrl: profile.avatarUrl,
          })
          .catch(() => undefined);
      }

      if (method !== PaymentMethod.Cash) await paymentService.pay(booking.id, method);
      navigate(`/bookings/${booking.id}`, {
        state: {
          toast:
            method === PaymentMethod.Cash
              ? "Đã đặt đơn. Hệ thống đang tìm Tasker cho bạn."
              : "Thanh toán thành công. Hệ thống đang tìm Tasker cho bạn.",
        },
      });
    } catch (err) {
      if (createdId) setPayFailedId(createdId);
      setServerError(
        createdId
          ? `Đơn đã được tạo nhưng thanh toán chưa thành công: ${getErrorMessage(err)}`
          : getErrorMessage(err),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const payOptions = [
    { m: PaymentMethod.EWallet, title: "Ví điện tử", sub: "MoMo, ZaloPay", Icon: Wallet },
    { m: PaymentMethod.Card, title: "Thẻ ngân hàng", sub: "Visa, Napas", Icon: CreditCard },
    {
      m: PaymentMethod.Cash,
      title: "Tiền mặt",
      sub: cashAllowed ? "Trả cho Tasker khi xong việc" : cashReason,
      Icon: Banknote,
      disabled: !cashAllowed,
    },
  ];

  return (
    <AppShell>
      <div className="page-head">
        <div>
          <h1 className="page-title">Đặt dịch vụ</h1>
          <p className="page-sub">Điền 4 bước, tổng tiền được tính sẵn theo bảng giá.</p>
        </div>
      </div>

      {debt > 0 && (
        <div className="notice notice--danger booking-debt">
          <AlertTriangle size={20} />
          <div>
            <b>Bạn còn khoản chưa thanh toán {formatVND(debt)}</b>
            Thanh toán khoản này trước khi đặt đơn mới.
          </div>
          <Link to="/bookings?tab=confirm" className="btn btn-danger btn-sm notice-action">
            Xem đơn cần trả
          </Link>
        </div>
      )}

      <form className="booking" onSubmit={submit} noValidate>
        <div className="booking-main">
          {/* 1. Dịch vụ */}
          <section className="panel bk-step">
            <h2 className="bk-title">
              <span>1</span> Chọn dịch vụ
            </h2>
            {svcError ? (
              <div className="notice notice--warn">
                {svcError}
                <button type="button" className="link notice-action" onClick={reload}>
                  Thử lại
                </button>
              </div>
            ) : !services ? (
              <div className="svc-grid">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 76 }} />
                ))}
              </div>
            ) : (
              <div className="svc-grid" role="radiogroup" aria-label="Dịch vụ">
                {services.map((s) => {
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={s.id === serviceId}
                      className="svc-opt"
                      onClick={() => setServiceId(s.id)}
                    >
                      <ServiceBadge name={s.name} iconUrl={s.iconUrl} size={21} />
                      <span>
                        <b>{s.name}</b>
                        <small>
                          {formatVND(s.basePrice)} / {s.unit}
                        </small>
                      </span>
                      {s.id === serviceId && <Check className="svc-check" size={18} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            )}
            {service?.description && <p className="hint bk-desc">{service.description}</p>}
            <div className="bk-qty">
              <div>
                <b>Số {unit}</b>
                <span className="hint">Tối đa 12 {unit} cho mỗi đơn</span>
              </div>
              <div className="qty">
                <button type="button" aria-label="Giảm" disabled={quantity <= 1} onClick={() => setQuantity((q) => q - 1)}>
                  <Minus size={16} />
                </button>
                <output aria-live="polite">
                  {quantity} {unit}
                </output>
                <button type="button" aria-label="Tăng" disabled={quantity >= 12} onClick={() => setQuantity((q) => q + 1)}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </section>

          {/* 2. Thời gian */}
          <section className="panel bk-step">
            <h2 className="bk-title">
              <span>2</span> Chọn ngày giờ
            </h2>
            <div className="day-row" role="radiogroup" aria-label="Ngày">
              {days.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={ymd(d) === date}
                  className="day"
                  onClick={() => setDate(ymd(d))}
                >
                  <small>{i === 0 ? "Hôm nay" : i === 1 ? "Mai" : WEEKDAY[d.getDay()]}</small>
                  <b>{pad(d.getDate())}</b>
                </button>
              ))}
              <label className="day day--pick" aria-checked={!days.some((d) => ymd(d) === date)}>
                <small>Ngày khác</small>
                <b className="day-pick-val">
                  {days.some((d) => ymd(d) === date) ? <CalendarDays size={20} /> : `${date.slice(8)}/${date.slice(5, 7)}`}
                </b>
                <input
                  type="date"
                  aria-label="Chọn ngày khác"
                  min={ymd(new Date())}
                  max={ymd(addDays(new Date(), 30))}
                  value={date}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                  onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
                />
              </label>
            </div>
            <div className="chips bk-times" role="radiogroup" aria-label="Giờ bắt đầu">
              {TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={t === time}
                  className="chip"
                  disabled={tooSoon(t)}
                  onClick={() => setTime(t)}
                >
                  {t}
                </button>
              ))}
              <label className="chip chip--time">
                <Clock size={15} />
                <input
                  type="time"
                  aria-label="Giờ khác"
                  value={time}
                  onChange={(e) => e.target.value && setTime(e.target.value)}
                />
              </label>
            </div>
            {errors.time ? (
              <span className="field-error">{errors.time}</span>
            ) : (
              <span className="hint">Đặt trước ít nhất 1 giờ và tối đa 30 ngày.</span>
            )}
          </section>

          {/* 3. Địa điểm */}
          <section className="panel bk-step">
            <h2 className="bk-title">
              <span>3</span> Địa chỉ làm việc
            </h2>
            <div className="field">
              <label htmlFor="address">Số nhà, tên đường, phường, quận</label>
              <div className="addr-row">
                <div className="input-icon">
                  <MapPin size={18} />
                  <input
                    id="address"
                    type="text"
                    maxLength={255}
                    placeholder="Nhập địa chỉ, ví dụ 12 Nguyễn Huệ, Quận 1"
                    value={address}
                    onChange={(e) => {
                      addressTouched.current = true;
                      setAddress(e.target.value);
                      setResults(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        runSearch();
                      }
                    }}
                    aria-invalid={!!errors.address}
                  />
                  {resolving && <Loader2 className="input-suffix spin" size={18} />}
                </div>
                <button type="button" className="btn btn-outline" aria-label="Tìm địa chỉ trên bản đồ" onClick={() => runSearch()} disabled={searching}>
                  {searching ? <Loader2 className="spin" size={17} /> : <Search size={17} />}
                  <span className="hide-sm">Tìm trên bản đồ</span>
                </button>
              </div>
              {errors.address && <span className="field-error">{errors.address}</span>}
              {results && results.length > 0 && (
                <ul className="addr-results" role="listbox" aria-label="Kết quả tìm địa chỉ">
                  {results.map((r, i) => (
                    <li key={i}>
                      <button type="button" onClick={() => choosePlace(r)}>
                        <MapPin size={16} />
                        <span>
                          {r.title && <b>{r.title}</b>}
                          {r.address}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="chips addr-quick">
              <button type="button" className="chip" onClick={() => locateMe()} disabled={locating}>
                {locating ? <Loader2 className="spin" size={16} /> : <Crosshair size={16} />}
                Dùng vị trí hiện tại
              </button>
              {profileAddress && profileAddress !== address && (
                <button
                  type="button"
                  className="chip"
                  onClick={() => {
                    setAddress(profileAddress);
                    addressTouched.current = true;
                    runSearch(profileAddress);
                  }}
                >
                  <UserRound size={16} /> Địa chỉ trong hồ sơ
                </button>
              )}
            </div>

            <div className="map-wrap">
              <MapView home={pin} onPick={(p) => pick(p)} height={300} label="Bản đồ chọn vị trí làm việc" />
              {!pinned && (
                <div className="map-hint">
                  <MapPin size={16} /> Bấm lên bản đồ hoặc kéo ghim tới đúng nhà bạn
                </div>
              )}
            </div>
            {errors.pin ? (
              <span className="field-error">{errors.pin}</span>
            ) : geoMsg ? (
              <span className="hint hint--warn">{geoMsg}</span>
            ) : (
              <span className="hint">
                {pinned
                  ? "Đã ghim vị trí. Kéo ghim nếu chưa đúng, ô địa chỉ sẽ tự cập nhật theo bản đồ."
                  : "Tasker dùng vị trí ghim để tìm đường, hãy ghim chính xác."}
              </span>
            )}
            {canSaveAddress && (
              <label className="check bk-save">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                Lưu địa chỉ này vào hồ sơ để lần sau tự điền
              </label>
            )}
          </section>

          {/* 4. Liên hệ & thanh toán */}
          <section className="panel bk-step">
            <h2 className="bk-title">
              <span>4</span> Liên hệ và thanh toán
            </h2>
            <div className="bk-two">
              <div className="field">
                <label htmlFor="phone">Số điện thoại liên hệ</label>
                <div className="input-icon">
                  <Phone size={18} />
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Nhập số điện thoại để Tasker liên hệ"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    aria-invalid={!!errors.phone}
                  />
                </div>
                {errors.phone ? (
                  <span className="field-error">{errors.phone}</span>
                ) : (
                  <span className="hint">Tasker gọi số này khi đến nơi hoặc cần hỏi thêm.</span>
                )}
                {profilePhone && profilePhone !== phone && (
                  <button type="button" className="chip chip--sm" onClick={() => setPhone(profilePhone)}>
                    <UserRound size={14} /> Dùng số trong hồ sơ: {formatPhone(profilePhone)}
                  </button>
                )}
                {canSavePhone && !validatePhone(phone) && phone.length === 10 && (
                  <label className="check bk-save">
                    <input type="checkbox" checked={savePhone} onChange={(e) => setSavePhone(e.target.checked)} />
                    {profilePhone ? "Cập nhật số này vào hồ sơ" : "Lưu số này vào hồ sơ"}
                  </label>
                )}
              </div>
              <div className="field">
                <label htmlFor="note">Ghi chú cho Tasker (không bắt buộc)</label>
                <textarea
                  id="note"
                  rows={3}
                  maxLength={500}
                  placeholder="Ví dụ: nhà có nuôi mèo, gửi xe ở hầm B1…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <span className="hint">{note.length}/500</span>
              </div>
            </div>

            <div className="label">Phương thức thanh toán</div>
            <div className="pay-grid" role="radiogroup" aria-label="Phương thức thanh toán">
              {payOptions.map(({ m, title, sub, Icon, disabled }) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={method === m}
                  disabled={disabled}
                  className="pay-opt"
                  onClick={() => setMethod(m)}
                >
                  <Icon size={20} />
                  <b>{title}</b>
                  <small>{sub}</small>
                </button>
              ))}
            </div>
            {method === PaymentMethod.Cash ? (
              <>
                <label className="check bk-save">
                  <input type="checkbox" checked={present} onChange={(e) => setPresent(e.target.checked)} />
                  Tôi cam kết có mặt khi Tasker hoàn thành để trả tiền mặt
                </label>
                {errors.present && <span className="field-error">{errors.present}</span>}
              </>
            ) : (
              <p className="hint pay-note">
                <Info size={15} /> Thanh toán giả lập để demo, không trừ tiền thật. Đơn cần thanh toán trong 15 phút.
              </p>
            )}
          </section>
        </div>

        {/* Tóm tắt */}
        <aside className="booking-side">
          <div className="panel summary">
            <h2 className="panel-title">Tóm tắt đơn</h2>
            {service ? (
              <div className="sum-svc">
                <ServiceBadge name={service.name} iconUrl={service.iconUrl} size={22} />
                <div>
                  <b>{service.name}</b>
                  <span>
                    {dayText()} · {time}
                    {endText()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="skeleton" style={{ height: 52 }} />
            )}
            <div className="kv">
              <span>Đơn giá</span>
              <b>{service ? `${formatVND(service.basePrice)} / ${unit}` : "—"}</b>
            </div>
            <div className="kv">
              <span>Số lượng</span>
              <b>
                {quantity} {unit}
              </b>
            </div>
            <div className="kv">
              <span>Địa chỉ</span>
              <b className="sum-addr">{address.trim() || "Chưa chọn"}</b>
            </div>
            <div className="sum-total">
              <span>Tổng thanh toán</span>
              <strong>{formatVND(total)}</strong>
            </div>
            {serverError && (
              <div className="notice notice--danger" role="alert">
                <div>
                  {serverError}
                  {payFailedId && (
                    <>
                      {" "}
                      <Link to={`/bookings/${payFailedId}`} className="link">
                        Mở đơn để thanh toán lại
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting || debt > 0 || !service}>
              {submitting ? (
                <span className="spinner" />
              ) : method === PaymentMethod.Cash ? (
                "Đặt đơn"
              ) : (
                `Thanh toán ${formatVND(total)}`
              )}
            </button>
            <p className="sum-safe">
              <Lock size={15} /> Tiền được tạm giữ, chỉ chuyển cho Tasker khi bạn xác nhận hoàn thành.
            </p>
          </div>
        </aside>
      </form>
    </AppShell>
  );
}
