// US10/US11 - Trang chủ: xem/tìm dịch vụ và bảng giá
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Search,
  Star,
  ShieldCheck,
  Zap,
  SprayCan,
  Shirt,
  CookingPot,
  Bike,
  CircleCheck,
  ShoppingCart,
  Calendar,
  Coins,
  Lock,
  MapPin,
  Handshake,
  Briefcase,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { iconForService } from "../components/ServiceIcon";
import { serviceCatalog } from "../services/serviceCatalog";
import { formatPrice } from "../utils/format";
import type { ServiceCategory } from "../types";
import { FALLBACK_SERVICES as FALLBACK } from "../data/fallbackServices";
import "../styles/landing.css";

const STEPS = [
  {
    Icon: ShoppingCart,
    title: "Chọn dịch vụ",
    desc: "Xem giá rõ ràng cho từng dịch vụ.",
  },
  {
    Icon: Calendar,
    title: "Chọn giờ & địa điểm",
    desc: "Đặt lịch, ghim vị trí, thanh toán trước.",
  },
  {
    Icon: Bike,
    title: "Tasker đến làm",
    desc: "Hệ thống mời Tasker gần nhất, theo dõi vị trí trực tiếp.",
  },
  {
    Icon: CircleCheck,
    title: "Xác nhận & thanh toán",
    desc: "Xem ảnh trước/sau, xác nhận để chuyển tiền.",
  },
  {
    Icon: Star,
    title: "Đánh giá",
    desc: "Chia sẻ trải nghiệm để giữ chất lượng.",
  },
];

const WHY = [
  {
    Icon: Zap,
    title: "Đặt lịch trong 60 giây",
    desc: "Vài chạm là xong, đặt trước tới 30 ngày.",
  },
  {
    Icon: ShieldCheck,
    title: "Tasker được xác thực",
    desc: "Hồ sơ CCCD, kỹ năng được quản trị viên duyệt.",
  },
  {
    Icon: Coins,
    title: "Giá minh bạch",
    desc: "Giá hiển thị trước, không phụ phí phát sinh.",
  },
  {
    Icon: Lock,
    title: "Tiền được tạm giữ",
    desc: "Chỉ chuyển cho Tasker khi bạn xác nhận hoàn thành.",
  },
  {
    Icon: MapPin,
    title: "Theo dõi thời gian thực",
    desc: "Biết Tasker đang ở đâu và bao lâu nữa đến.",
  },
  {
    Icon: Handshake,
    title: "Khiếu nại & hoàn tiền",
    desc: "Làm chưa đạt? Admin xử lý trong 24 giờ.",
  },
];

const STATS = [
  ["10k+", "Khách hàng tin dùng"],
  ["98%", "Khách hài lòng"],
  ["50k+", "Công việc hoàn thành"],
  ["200k+", "Giờ làm việc"],
];

const TEAL = "#0f9b8e";

export default function Landing() {
  const [services, setServices] = useState<ServiceCategory[]>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Tải dịch vụ từ API (FR-08); lỗi => dùng dữ liệu mẫu
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      serviceCatalog
        .list(query || undefined)
        .then((data) => {
          if (!cancelled) setServices(data.filter((s) => s.isActive));
        })
        .catch(() => {
          if (!cancelled) {
            const q = query.trim().toLowerCase();
            setServices(
              q
                ? FALLBACK.filter((s) => s.name.toLowerCase().includes(q))
                : FALLBACK,
            );
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300); // debounce 300ms theo SRS
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  // Cuộn tới mục khi điều hướng từ trang khác
  useEffect(() => {
    const id = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (id)
      setTimeout(
        () =>
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
  }, [location.state]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(keyword.trim());
    document.getElementById("dich-vu")?.scrollIntoView({ behavior: "smooth" });
  };

  const cards = useMemo(() => services, [services]);

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="hero-badge">
              <Sparkles size={16} color="#f5a000" /> Giảm 30% cho đơn đầu tiên
            </span>
            <h1 className="hero-title">Một chạm – nhà gọn gàng</h1>
            <p className="hero-desc">
              Đặt dọn dẹp, giặt ủi, sửa điện nước… chỉ từ 60 giây. Giá rõ ràng,
              Tasker đã được xác thực, tiền chỉ chuyển khi bạn hài lòng.
            </p>
            <form className="hero-search" onSubmit={submitSearch} role="search">
              <label>
                <Search size={18} />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Bạn cần dịch vụ gì hôm nay?"
                  aria-label="Tìm dịch vụ"
                />
              </label>
              <button type="submit" className="btn btn-primary">
                Tìm dịch vụ
              </button>
            </form>
            <div className="hero-stats">
              {[
                [Star, "4.9", "Điểm đánh giá TB"],
                [ShieldCheck, "100%", "Tasker xác thực"],
                [Zap, "60 giây", "Để đặt lịch"],
              ].map(([I, v, l]) => {
                const Icon = I as typeof Star;
                return (
                  <div key={l as string}>
                    <div className="hero-stat-top">
                      <Icon size={24} color={TEAL} /> {v as string}
                    </div>
                    <div className="hero-stat-label">{l as string}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <span className="blob blob-1" />
            <span className="blob blob-2" />
            <div className="phone">
              <div className="phone-screen">
                <div className="phone-hello">Xin chào, Minh</div>
                <div className="phone-promo">
                  <div>
                    <b>Giảm 30%</b>
                    <span>đơn đầu tiên</span>
                  </div>
                  <SprayCan size={34} color="#0f2a33" />
                </div>
                {[
                  [
                    Sparkles,
                    "var(--pastel-mint)",
                    "Dọn dẹp nhà",
                    "150.000 đ/giờ",
                  ],
                  [Shirt, "var(--pastel-lilac)", "Giặt ủi", "từ 80.000 đ"],
                  [CookingPot, "var(--pastel-peach)", "Nấu ăn", "từ 120.000 đ"],
                ].map(([I, bg, n, p]) => {
                  const Icon = I as typeof Sparkles;
                  return (
                    <div className="phone-item" key={n as string}>
                      <span
                        className="phone-item-icon"
                        style={{ background: bg as string }}
                      >
                        <Icon size={19} color={TEAL} />
                      </span>
                      <div>
                        <b>{n as string}</b>
                        <span>{p as string}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="phone-cta">Đặt ngay</div>
              </div>
            </div>
            <div className="float-card float-1">
              <Bike size={23} color={TEAL} />
              <div>
                <b>Tasker đã nhận đơn</b>
                <span>Trần Thị Hoa · ★ 4.9</span>
              </div>
            </div>
            <div className="float-card float-2">
              <CircleCheck size={23} color="#22a06b" />
              <div>
                <b>Hoàn thành!</b>
                <span>Tiền được giải ngân</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dịch vụ */}
      <section id="dich-vu" className="section services">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">DỊCH VỤ PHỔ BIẾN</span>
            <h2 className="section-title">Mọi việc nhà, đã có Tasker lo</h2>
            <p className="section-sub">
              Giá niêm yết minh bạch ngay trên ứng dụng, không phụ phí ẩn.
            </p>
          </div>
          <div className="service-grid" aria-busy={loading}>
            {cards.length === 0 && !loading && (
              <p className="services-state">
                Không tìm thấy dịch vụ phù hợp với “{query}”.
              </p>
            )}
            {cards.map((s) => {
              const { Icon, bg } = iconForService(s.name);
              return (
                <Link
                  key={s.id}
                  to={`/booking/new?serviceId=${s.id}`}
                  className="service-card"
                >
                  <span className="service-icon" style={{ background: bg }}>
                    <Icon size={34} color={TEAL} />
                  </span>
                  <span className="service-name">{s.name}</span>
                  <span className="service-price">
                    {formatPrice(s.basePrice, s.unit)}
                  </span>
                  <span className="service-cta">Đặt ngay →</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quy trình */}
      <section id="quy-trinh" className="section steps">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">QUY TRÌNH 5 BƯỚC</span>
            <h2 className="section-title">Đặt dịch vụ dễ như nhắn tin</h2>
            <p className="section-sub">
              Từ lúc chọn dịch vụ đến khi đánh giá, mọi bước đều theo dõi được.
            </p>
          </div>
          <div className="step-grid">
            {STEPS.map(({ Icon, title, desc }, i) => (
              <div className="step-card" key={title}>
                <span className="step-num">{i + 1}</span>
                <Icon size={38} color={TEAL} strokeWidth={1.8} />
                <h3 className="step-title">{title}</h3>
                <p className="step-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vì sao chọn */}
      <section id="vi-sao" className="section why">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">VÌ SAO CHỌN HOMESERVICE</span>
            <h2 className="section-title">
              An tâm từ lúc đặt đến lúc hoàn thành
            </h2>
          </div>
          <div className="why-grid">
            {WHY.map(({ Icon, title, desc }) => (
              <div className="why-card" key={title}>
                <span className="why-icon">
                  <Icon size={25} color={TEAL} />
                </span>
                <div>
                  <h3 className="why-title">{title}</h3>
                  <p className="why-desc">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats">
        <div className="container stats-grid">
          {STATS.map(([n, l]) => (
            <div key={l}>
              <div className="stats-num">{n}</div>
              <div className="stats-label">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Trở thành Tasker */}
      <section id="tasker" className="section tasker">
        <div className="container">
          <div className="tasker-box">
            <div className="tasker-copy">
              <h2 className="tasker-title">Trở thành Tasker của HomeService</h2>
              <p className="tasker-desc">
                Nhận việc gần nhà, tự chủ lịch làm, thu nhập ổn định. Chỉ cần
                gửi hồ sơ và được duyệt.
              </p>
              <button
                type="button"
                className="btn btn-dark"
                onClick={() => navigate("/tasker-guide")}
              >
                Đăng ký làm Tasker
              </button>
            </div>
            <Briefcase
              size={114}
              strokeWidth={1.4}
              color="#0f2a33"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
