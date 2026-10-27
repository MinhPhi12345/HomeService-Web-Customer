// W01 – Trang giới thiệu hệ thống HomeService
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Camera,
  Check,
  ChevronDown,
  Download,
  Globe,
  LayoutDashboard,
  MapPinned,
  Minus,
  Plus,
  RefreshCw,
  Scale,
  ShieldCheck,
  Smartphone,
  Star,
  Wallet,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import { DownloadButton, DownloadQr } from "../components/AppDownload";
import { iconForService } from "../components/ServiceIcon";
import ServiceBadge from "../components/ServiceBadge";
import { useServices } from "../hooks/useServices";
import { useAuth } from "../context/AuthContext";
import { formatVND } from "../utils/format";
import type { ServiceCategory } from "../types";
import "../styles/landing.css";

/* ------------------------------------------------------------------ Nội dung */

const SYSTEM_PARTS = [
  {
    Icon: Globe,
    name: "Website khách hàng",
    text: "Đặt dịch vụ, thanh toán, theo dõi đơn và gửi khiếu nại ngay trên trình duyệt.",
    points: ["Bảng giá niêm yết", "Ghim địa chỉ trên bản đồ", "Lịch sử thanh toán"],
  },
  {
    Icon: Smartphone,
    name: "Ứng dụng Android",
    text: "Một ứng dụng cho cả khách hàng và Tasker, dùng chung tài khoản với website.",
    points: ["Tasker nhận việc theo bán kính", "Chụp ảnh trước và sau ca làm", "Ví thu nhập, rút tiền"],
  },
  {
    Icon: LayoutDashboard,
    name: "Trang quản trị",
    text: "Quản trị viên duyệt hồ sơ Tasker, xử lý khiếu nại và theo dõi doanh thu.",
    points: ["Duyệt CCCD Tasker", "Phân xử khiếu nại", "Báo cáo theo thời gian"],
  },
];

const STEPS = [
  {
    title: "Đặt lịch và thanh toán",
    text: "Chọn dịch vụ, giờ hẹn, ghim địa chỉ. Tiền được hệ thống tạm giữ, chưa chuyển cho ai.",
  },
  {
    title: "Ghép Tasker gần bạn",
    text: "Lời mời gửi lần lượt trong bán kính 3, 5 rồi 8 km tới Tasker có đúng kỹ năng.",
  },
  {
    title: "Tasker đến làm việc",
    text: "Bạn thấy Tasker trên bản đồ khi họ đang đến. Ảnh trước và sau ca làm được lưu lại.",
  },
  {
    title: "Xác nhận, tiền mới chuyển",
    text: "Hài lòng thì bấm xác nhận. Chưa ổn thì khiếu nại trong 24 giờ, quản trị viên xử lý.",
  },
];

const FEATURES = [
  { Icon: ShieldCheck, title: "Tiền được tạm giữ", text: "Thanh toán online nằm ở hệ thống cho tới khi bạn xác nhận công việc đã xong." },
  { Icon: BadgeCheck, title: "Tasker đã xác thực", text: "Mỗi Tasker gửi CCCD, kỹ năng và khu vực làm việc để quản trị viên duyệt." },
  { Icon: Camera, title: "Ảnh trước và sau", text: "Tasker chụp ảnh lúc bắt đầu và lúc xong việc để bạn đối chiếu." },
  { Icon: Scale, title: "Khiếu nại có người xử lý", text: "Gửi ảnh bằng chứng trong 24 giờ. Tiền vẫn được giữ cho tới khi có kết quả." },
  { Icon: Star, title: "Đánh giá hai chiều", text: "Khách và Tasker chấm điểm nhau sau mỗi đơn, đánh giá bất thường có thể báo cáo." },
];

const FAQ = [
  {
    q: "Tôi có phải trả thêm tiền cho Tasker không?",
    a: "Không. Tổng tiền được tính theo bảng giá ngay khi đặt (đơn giá × số lượng). Tasker không được thu thêm.",
  },
  {
    q: "Khi nào được thanh toán tiền mặt?",
    a: "Khi bạn đã có ít nhất 3 đơn hoàn tất, không còn khoản nợ và đơn có giá trị đến 1.000.000 đ. Bạn cần cam kết có mặt lúc Tasker hoàn thành.",
  },
  {
    q: "Hủy đơn có mất phí không?",
    a: "Hủy khi chưa có Tasker nhận thì miễn phí. Hủy sát giờ hẹn sau khi Tasker đã nhận có thể mất phí, số tiền hiện rõ trước khi bạn xác nhận hủy.",
  },
  {
    q: "Nếu Tasker không đến thì sao?",
    a: "Sau 30 phút trễ hẹn, bạn có thể tìm Tasker khác hoặc hủy đơn và được hoàn 100%.",
  },
  {
    q: "Làm sao để trở thành Tasker?",
    a: "Tải ứng dụng Android, đăng ký tài khoản Tasker và gửi hồ sơ CCCD. Khi quản trị viên duyệt, bạn bật nhận việc là có lời mời.",
  },
];

/* ------------------------------------------------------------------ Khối nhỏ */

/** Màn hình ứng dụng minh họa (dựng bằng HTML/CSS) */
function PhonePreview() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="phone">
        <div className="phone-notch" />
        <div className="phone-screen">
          <div className="ps-top">
            <span>Xin chào, Minh</span>
            <BellRing size={15} />
          </div>
          <div className="ps-card ps-card--teal">
            <small>Đơn sắp tới</small>
            <b>Dọn dẹp nhà · 2 giờ</b>
            <span>Mai, 09:00 · 300.000 đ</span>
            <div className="ps-progress">
              <i className="done" />
              <i className="done" />
              <i className="now" />
              <i />
            </div>
          </div>
          <div className="ps-grid">
            {["Dọn dẹp nhà", "Giặt ủi", "Nấu ăn", "Sửa điện nước", "Chăm sóc cây", "Máy lạnh"].map((n) => {
              const { Icon, bg, fg } = iconForService(n);
              return (
                <span key={n} className="ps-svc">
                  <i style={{ background: bg, color: fg }}>
                    <Icon size={16} />
                  </i>
                  {n.split(" ").slice(0, 2).join(" ")}
                </span>
              );
            })}
          </div>
          <div className="ps-map">
            <svg viewBox="0 0 200 90" preserveAspectRatio="none">
              <path className="ps-road" d="M10 70 C 50 70, 60 20, 100 30 S 160 70, 190 20" />
              <path className="ps-route" d="M10 70 C 50 70, 60 20, 100 30 S 160 70, 190 20" />
            </svg>
            <span className="ps-dot" />
          </div>
        </div>
      </div>

      <div className="float-card fc-1">
        <span className="fc-avatar">L</span>
        <div>
          <b>Tasker Lan đã nhận đơn</b>
          <small>Dọn dẹp nhà · 4,9 ★</small>
        </div>
        <Check size={18} className="fc-ok" />
      </div>
      <div className="float-card fc-2">
        <span className="fc-pin">
          <MapPinned size={17} />
        </span>
        <div>
          <b>Đang đến</b>
          <small>Cách nhà bạn 1,2 km</small>
        </div>
      </div>
      <div className="float-card fc-3">
        <ShieldCheck size={18} />
        <div>
          <b>300.000 đ đang tạm giữ</b>
          <small>Chuyển khi bạn xác nhận</small>
        </div>
      </div>
    </div>
  );
}

/** Dải dịch vụ chạy ngang */
function ServiceMarquee({ services }: { services: ServiceCategory[] | null }) {
  if (!services?.length) return null;
  const row = [...services, ...services, ...services];
  return (
    <div className="marquee" aria-label="Các dịch vụ">
      <div className="marquee-track">
        {[0, 1].map((k) => (
          <div className="marquee-group" key={k} aria-hidden={k === 1}>
            {row.map((s, i) => {
              return (
                <span className="marquee-item" key={`${k}-${i}`}>
                  <ServiceBadge name={s.name} iconUrl={s.iconUrl} size={18} className="marquee-ico" />
                  {s.name}
                  <small>
                    từ {formatVND(s.basePrice)}/{s.unit}
                  </small>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickBook({ services, error, reload }: ReturnType<typeof useServices>) {
  const navigate = useNavigate();
  const [id, setId] = useState<number | null>(null);
  const [qty, setQty] = useState(2);

  useEffect(() => {
    if (services?.length && id == null) setId((services.find((s) => s.unit === "giờ") ?? services[0]).id);
  }, [services, id]);

  const svc = services?.find((s) => s.id === id);

  return (
    <div className="qb">
      <div className="qb-head">
        <h3>Ước tính chi phí</h3>
        <span>Giá niêm yết, không phụ thu</span>
      </div>
      {error ? (
        <div className="qb-error">
          <p>{error}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={reload}>
            <RefreshCw size={15} /> Tải lại bảng giá
          </button>
        </div>
      ) : !services ? (
        <div className="qb-list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 54 }} />
          ))}
        </div>
      ) : (
        <div className="qb-list" role="radiogroup" aria-label="Dịch vụ">
          {services.slice(0, 5).map((s) => {
            const on = s.id === id;
            return (
              <button key={s.id} type="button" role="radio" aria-checked={on} className="qb-item" onClick={() => setId(s.id)}>
                <ServiceBadge name={s.name} iconUrl={s.iconUrl} size={20} />
                <span className="qb-name">
                  <b>{s.name}</b>
                  <small>
                    {formatVND(s.basePrice)} / {s.unit}
                  </small>
                </span>
                <span className="qb-radio">{on && <Check size={14} strokeWidth={3} />}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="qb-qty">
        <span>Số {svc?.unit ?? "giờ"}</span>
        <div className="qb-stepper">
          <button type="button" aria-label="Giảm" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)}>
            <Minus size={16} />
          </button>
          <output aria-live="polite">{qty}</output>
          <button type="button" aria-label="Tăng" disabled={qty >= 12} onClick={() => setQty((q) => q + 1)}>
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="qb-total">
        <span>Tạm tính</span>
        <strong key={`${id}-${qty}`}>{svc ? formatVND(svc.basePrice * qty) : "—"}</strong>
      </div>
      <button
        type="button"
        className="btn btn-primary btn-lg btn-block"
        disabled={!svc}
        onClick={() => navigate(`/booking/new?serviceId=${svc!.id}&quantity=${qty}`)}
      >
        Chọn giờ &amp; địa chỉ
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ Trang */

export default function Landing() {
  const { user } = useAuth();
  const { hash } = useLocation();
  const svc = useServices();
  const { services, error, reload } = svc;

  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 60);
    return () => clearTimeout(t);
  }, [hash]);

  const bookLink = user ? "/booking/new" : "/register";

  return (
    <>
      <Navbar variant="public" />
      <main className="landing">
        {/* ============ Hero ============ */}
        <section className="hero">
          <div className="hero-bg" aria-hidden="true">
            <span className="blob b1" />
            <span className="blob b2" />
            <span className="blob b3" />
          </div>
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="hero-pill hero-in" style={{ animationDelay: "0ms" }}>
                <span className="live-dot" /> Đang phục vụ tại TP. Hồ Chí Minh
              </p>
              <h1 className="hero-in" style={{ animationDelay: "80ms" }}>
                Việc nhà có người lo, bạn có thêm thời gian.
              </h1>
              <p className="hero-lead hero-in" style={{ animationDelay: "160ms" }}>
                HomeService kết nối gia đình với Tasker đã xác thực cho dọn nhà, giặt ủi, nấu ăn, sửa điện nước.
                Đặt trên website hoặc ứng dụng, theo dõi Tasker trên bản đồ, chỉ trả tiền khi việc đã xong.
              </p>
              <div className="hero-cta hero-in" style={{ animationDelay: "240ms" }}>
                <Link to={bookLink} className="btn btn-primary btn-lg">
                  {user ? "Đặt dịch vụ ngay" : "Bắt đầu đặt dịch vụ"} <ArrowRight size={18} />
                </Link>
                <a href="#tai-app" className="btn btn-outline btn-lg">
                  <Download size={18} /> Tải ứng dụng
                </a>
              </div>
              <ul className="hero-facts hero-in" style={{ animationDelay: "320ms" }}>
                <li>
                  <BadgeCheck size={18} /> Tasker duyệt hồ sơ CCCD
                </li>
                <li>
                  <ShieldCheck size={18} /> Tiền tạm giữ an toàn
                </li>
                <li>
                  <Camera size={18} /> Ảnh trước và sau ca làm
                </li>
              </ul>
            </div>
            <PhonePreview />
          </div>
          <ServiceMarquee services={services} />
        </section>

        {/* ============ Hệ thống gồm ============ */}
        <section className="section" id="he-thong">
          <div className="container">
            <Reveal className="section-head section-head--center">
              <h2>Một hệ thống, ba cách sử dụng</h2>
              <p>Khách hàng, Tasker và quản trị viên dùng chung một Backend và một cơ sở dữ liệu, nên mọi thay đổi của đơn hiện ở cả ba nơi.</p>
            </Reveal>
            <div className="parts">
              {SYSTEM_PARTS.map(({ Icon, name, text, points }, i) => (
                <Reveal as="article" key={name} className="part" delay={i * 110}>
                  <span className="part-icon">
                    <Icon size={24} />
                  </span>
                  <h3>{name}</h3>
                  <p>{text}</p>
                  <ul>
                    {points.map((p) => (
                      <li key={p}>
                        <Check size={15} strokeWidth={3} /> {p}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ Dịch vụ & bảng giá ============ */}
        <section className="section section--tint" id="dich-vu">
          <div className="container">
            <Reveal className="section-head">
              <h2>Dịch vụ và bảng giá</h2>
              <p>Tổng tiền tính sẵn theo đơn vị của từng dịch vụ khi bạn đặt. Tasker không thu thêm.</p>
            </Reveal>
            {error ? (
              <div className="notice notice--warn">
                {error}
                <button type="button" className="link notice-action" onClick={reload}>
                  Thử lại
                </button>
              </div>
            ) : (
              <div className="svc-cards">
                {(services ?? Array.from({ length: 4 }, () => null)).map((s, i) =>
                  s ? (
                    <Reveal key={s.id} delay={(i % 4) * 80}>
                      <Link to={`/booking/new?serviceId=${s.id}`} className="svc-card">
                        <ServiceBadge name={s.name} iconUrl={s.iconUrl} size={26} className="svc-icon svc-icon--lg" />
                        <h3>{s.name}</h3>
                        {s.description && <p>{s.description}</p>}
                        <div className="svc-card-foot">
                          <span>
                            <b>{formatVND(s.basePrice)}</b> / {s.unit}
                          </span>
                          <span className="svc-go">
                            Đặt <ArrowRight size={15} />
                          </span>
                        </div>
                      </Link>
                    </Reveal>
                  ) : (
                    <div key={i} className="skeleton" style={{ height: 210 }} />
                  ),
                )}
              </div>
            )}
          </div>
        </section>

        {/* ============ Quy trình ============ */}
        <section className="section" id="quy-trinh">
          <div className="container">
            <Reveal className="section-head section-head--center">
              <h2>Một đơn diễn ra như thế nào</h2>
              <p>Bạn theo dõi từng bước trong mục Đơn của tôi, trên cả website và ứng dụng.</p>
            </Reveal>
            <Reveal as="div" className="steps-wrap">
              <ol className="steps">
                {STEPS.map((s, i) => (
                  <li key={s.title} style={{ ["--i" as string]: i }}>
                    <span className="step-num">{i + 1}</span>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        {/* ============ Tính năng ============ */}
        <section className="section section--dark" id="tinh-nang">
          <div className="container">
            <Reveal className="section-head">
              <h2>An tâm ở từng bước</h2>
              <p>Những cơ chế được xây vào hệ thống để cả khách hàng và Tasker được bảo vệ.</p>
            </Reveal>
            <div className="bento">
              <Reveal className="bento-main">
                <div className="track-demo" aria-hidden="true">
                  <svg viewBox="0 0 320 160" preserveAspectRatio="none">
                    <path className="td-road" d="M20 130 C 80 130, 90 40, 160 60 S 260 140, 300 40" />
                    <path className="td-route" d="M20 130 C 80 130, 90 40, 160 60 S 260 140, 300 40" />
                  </svg>
                  <span className="td-home">
                    <MapPinned size={18} />
                  </span>
                  <span className="td-tasker" />
                </div>
                <h3>Theo dõi Tasker trên bản đồ</h3>
                <p>
                  Khi Tasker đã nhận đơn và đang đến, bản đồ tự làm mới vị trí kèm khoảng cách tới nhà bạn. Bạn gọi
                  được cho Tasker ngay trong trang đơn.
                </p>
              </Reveal>
              {FEATURES.map(({ Icon, title, text }, i) => (
                <Reveal key={title} className="bento-item" delay={(i % 3) * 90}>
                  <span className="bento-icon">
                    <Icon size={21} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ Ước tính ============ */}
        <section className="section" id="uoc-tinh">
          <div className="container estimate">
            <Reveal className="estimate-copy">
              <h2>Biết trước chi phí trước khi đặt</h2>
              <p>
                Chọn dịch vụ và thời lượng, tổng tiền hiện ngay. Bước tiếp theo bạn chọn giờ hẹn, ghim địa chỉ trên
                bản đồ và nhập số điện thoại để Tasker liên hệ.
              </p>
              <ul className="estimate-list">
                <li>
                  <Wallet size={18} /> Ví điện tử, thẻ ngân hàng hoặc tiền mặt (khi đủ điều kiện)
                </li>
                <li>
                  <BellRing size={18} /> Thông báo khi có Tasker nhận, khi bắt đầu và khi xong việc
                </li>
              </ul>
            </Reveal>
            <Reveal delay={120}>
              <QuickBook {...svc} />
            </Reveal>
          </div>
        </section>

        {/* ============ Tải ứng dụng ============ */}
        <section className="download" id="tai-app">
          <div className="container download-grid">
            <Reveal className="download-copy">
              <h2>Mang HomeService theo trong túi</h2>
              <p>
                Ứng dụng Android dùng chung tài khoản với website. Khách hàng đặt và theo dõi đơn, Tasker nhận việc và
                báo vị trí ngay trên cùng một ứng dụng.
              </p>
              <ul className="download-list">
                <li>
                  <BellRing size={19} /> Báo ngay khi có Tasker nhận đơn
                </li>
                <li>
                  <MapPinned size={19} /> Xem Tasker đang đến trên bản đồ
                </li>
                <li>
                  <Wallet size={19} /> Tasker xem thu nhập và rút tiền về ví
                </li>
              </ul>
              <DownloadButton />
              <details className="install-help">
                <summary>Cách cài file APK</summary>
                <ol>
                  <li>Tải file HomeService.apk về điện thoại.</li>
                  <li>Mở file vừa tải. Nếu máy hỏi, cho phép “Cài đặt ứng dụng không rõ nguồn gốc” cho trình duyệt.</li>
                  <li>Mở ứng dụng và đăng nhập bằng tài khoản đã đăng ký trên website.</li>
                </ol>
              </details>
            </Reveal>
            <Reveal delay={120}>
              <DownloadQr />
            </Reveal>
          </div>
        </section>

        {/* ============ Hai đối tượng ============ */}
        <section className="section">
          <div className="container audiences">
            <Reveal className="aud aud--customer">
              <h3>Bạn cần người giúp việc nhà?</h3>
              <p>Tạo tài khoản miễn phí, đặt lịch trong vài phút và chỉ trả tiền khi hài lòng.</p>
              <Link to={bookLink} className="btn btn-dark">
                {user ? "Đặt dịch vụ" : "Tạo tài khoản khách hàng"} <ArrowRight size={17} />
              </Link>
            </Reveal>
            <Reveal className="aud aud--tasker" delay={120}>
              <h3>Bạn muốn kiếm thêm thu nhập?</h3>
              <p>Đăng ký làm Tasker trên ứng dụng, chọn khu vực và bán kính nhận việc, nhận 80% giá trị mỗi đơn.</p>
              <Link to="/tasker-guide" className="btn btn-accent">
                Xem cách trở thành Tasker <ArrowRight size={17} />
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ============ Hỏi đáp ============ */}
        <section className="section section--tint" id="hoi-dap">
          <div className="container faq-wrap">
            <Reveal className="section-head">
              <h2>Câu hỏi thường gặp</h2>
              <p>Chưa thấy câu trả lời? Gọi 1900 6868 hoặc email hotro@homeservice.vn.</p>
            </Reveal>
            <div className="faq">
              {FAQ.map((f, i) => (
                <Reveal key={f.q} delay={i * 60}>
                  <details className="faq-item">
                    <summary>
                      {f.q}
                      <ChevronDown size={20} />
                    </summary>
                    <p>{f.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
