// US04 - Hướng dẫn trở thành Tasker (đăng ký và gửi hồ sơ trên app di động)
import { Link } from "react-router-dom";
import {
  Briefcase,
  Apple,
  Play,
  Sparkles,
  MapPin,
  Smartphone,
  IdCard,
  Bike,
  Coins,
  Wallet,
  ShieldCheck,
  House,
  QrCode,
} from "lucide-react";
import Navbar from "../components/Navbar";
import "../styles/landing.css";
import "../styles/tasker.css";

const TEAL = "#0f9b8e";

const STEPS = [
  {
    Icon: Smartphone,
    title: "Tải app & đăng ký",
    desc: "Tạo tài khoản với vai trò Tasker trên ứng dụng di động.",
  },
  {
    Icon: IdCard,
    title: "Gửi hồ sơ xác thực",
    desc: "Số CCCD, kỹ năng, khu vực và điểm làm việc; quản trị viên sẽ duyệt hồ sơ.",
  },
  {
    Icon: Bike,
    title: "Bật nhận đơn",
    desc: "Nhận lời mời trong bán kính 3, 5 hoặc 8 km; người nhận trước được đơn.",
  },
];

const BENEFITS = [
  {
    Icon: MapPin,
    title: "Bán kính do bạn chọn",
    desc: "3, 5 hoặc 8 km quanh điểm làm việc của bạn.",
  },
  {
    Icon: Coins,
    title: "Nhận 80% giá trị đơn",
    desc: "Chiết khấu nền tảng 20%, tính minh bạch cho từng đơn.",
  },
  {
    Icon: Wallet,
    title: "Ví & rút tiền",
    desc: "Nạp ví để nhận đơn tiền mặt, rút thu nhập bất cứ lúc nào (≥ 50.000 đ).",
  },
  {
    Icon: ShieldCheck,
    title: "Được bảo vệ",
    desc: "Tiền khách được tạm giữ; khách nợ sẽ bị ghi nợ và chặn đặt đơn.",
  },
];

export default function TaskerGuide() {
  const download = (e: React.MouseEvent) => e.preventDefault(); // chưa có link store thật

  return (
    <>
      <Navbar variant="minimal" />

      <section className="tg-hero">
        <div className="container tg-hero-inner">
          <div className="tg-hero-copy">
            <span className="hero-badge">
              <Briefcase size={14} /> DÀNH CHO TASKER
            </span>
            <h1 className="tg-title">Nhận việc gần nhà, thu nhập ổn định</h1>
            <p className="tg-desc">
              Tải ứng dụng HomeService, gửi hồ sơ và bật nhận đơn. Hệ thống sẽ
              mời bạn những công việc phù hợp trong bán kính bạn chọn.
            </p>
            <div className="tg-stores">
              <a href="#" className="store-btn" onClick={download}>
                <Apple size={21} color="#fff" fill="#fff" />
                <span>
                  <small>Tải về trên</small>
                  <b>App Store</b>
                </span>
              </a>
              <a href="#" className="store-btn" onClick={download}>
                <Play size={21} color="#fff" fill="#fff" />
                <span>
                  <small>Tải trên</small>
                  <b>Google Play</b>
                </span>
              </a>
              <div className="qr" aria-label="Mã QR tải ứng dụng">
                <QrCode size={52} strokeWidth={1.4} />
              </div>
            </div>
            <p className="tg-note">
              Quét mã QR bằng điện thoại để tải ứng dụng (Android 8.0+ / iOS
              13+).
            </p>
          </div>

          <div className="tg-visual" aria-hidden="true">
            <span className="tg-blob" />
            <div className="tg-phone">
              <div className="tg-screen">
                <div className="tg-hello">Chào Hoa</div>
                <div className="tg-online">
                  <span>Đang nhận đơn</span>
                  <span className="toggle">
                    <i />
                  </span>
                </div>
                <div className="tg-offer">
                  <div className="tg-offer-row">
                    <Sparkles size={14} color="#f5a000" />{" "}
                    <b>Dọn dẹp nhà · 3 giờ</b>
                  </div>
                  <div className="tg-offer-row tg-offer-sub">
                    <MapPin size={14} color={TEAL} /> Quận 1 · 1,8 km
                  </div>
                  <div className="tg-offer-earn">
                    <span>Bạn nhận</span>
                    <b>360.000 đ</b>
                  </div>
                  <div className="tg-offer-btns">
                    <span className="b-ghost">Từ chối</span>
                    <span className="b-solid">Nhận đơn</span>
                  </div>
                </div>
                <div className="tg-income">
                  <span>Thu nhập hôm nay</span>
                  <b>720.000 đ</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tg-section tg-steps">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">BẮT ĐẦU TRONG 3 BƯỚC</span>
            <h2 className="tg-h2">Trở thành Tasker dễ dàng</h2>
          </div>
          <div className="tg-step-grid">
            {STEPS.map(({ Icon, title, desc }, i) => (
              <div className="tg-step" key={title}>
                <span className="step-num tg-num">{i + 1}</span>
                <Icon size={40} color={TEAL} strokeWidth={1.7} />
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tg-section tg-benefits">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">QUYỀN LỢI</span>
            <h2 className="tg-h2">Làm việc tự chủ, minh bạch</h2>
          </div>
          <div className="tg-benefit-grid">
            {BENEFITS.map(({ Icon, title, desc }) => (
              <div className="tg-benefit" key={title}>
                <span className="tg-benefit-icon">
                  <Icon size={23} color={TEAL} />
                </span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tg-cta">
        <div className="container tg-cta-inner">
          <div>
            <h2>Sẵn sàng nhận đơn đầu tiên?</h2>
            <p>Tải ứng dụng và gửi hồ sơ ngay hôm nay.</p>
          </div>
          <a href="#" className="btn btn-accent" onClick={download}>
            Tải ứng dụng
          </a>
        </div>
      </section>

      <footer className="tg-footer">
        <div className="container tg-footer-inner">
          <Link to="/" className="tg-footer-brand">
            <House size={19} color="#14b8a6" strokeWidth={2.2} /> HomeService
          </Link>
          <span>© 2026 HomeService – Nhóm 15</span>
        </div>
      </footer>
    </>
  );
}
