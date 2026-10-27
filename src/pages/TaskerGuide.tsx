// US04 – Hướng dẫn trở thành Tasker (đăng ký và gửi hồ sơ trên ứng dụng di động)
import { Camera, CircleAlert, IdCard, MapPin, Wallet, Wrench } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { DownloadButton, DownloadQr, InstallHelp } from "../components/AppDownload";
import "../styles/landing.css";

const STEPS = [
  {
    title: "Cài ứng dụng và tạo tài khoản Tasker",
    text: "Tải file cài đặt Android ở trang này, mở ứng dụng và chọn Đăng ký làm Tasker.",
  },
  {
    title: "Gửi hồ sơ xác thực",
    text: "Nhập số CCCD kèm ảnh mặt trước, chọn kỹ năng, khu vực, điểm làm việc và bán kính nhận việc.",
  },
  {
    title: "Chờ quản trị viên duyệt",
    text: "Bạn nhận thông báo khi hồ sơ được duyệt. Nếu bị từ chối, sửa thông tin và gửi lại ngay trong ứng dụng.",
  },
  {
    title: "Bật nhận việc",
    text: "Bật trạng thái sẵn sàng, ứng dụng báo vị trí để hệ thống mời bạn các đơn gần nhất khớp kỹ năng.",
  },
];

const DOCS = [
  { Icon: IdCard, title: "CCCD gắn chip", text: "Số CCCD 12 chữ số và ảnh chụp rõ mặt trước." },
  { Icon: Wrench, title: "Kỹ năng", text: "Chọn các dịch vụ bạn làm được. Bạn chỉ nhận lời mời cho đúng các dịch vụ này." },
  { Icon: MapPin, title: "Điểm làm việc", text: "Ghim nơi bạn thường xuất phát và chọn bán kính 3, 5 hoặc 8 km." },
  { Icon: Camera, title: "Điện thoại có camera", text: "Mỗi ca làm cần chụp ảnh khi bắt đầu và khi hoàn thành." },
];

export default function TaskerGuide() {
  return (
    <>
      <Navbar variant="public" />
      <main className="landing">
        <section className="download tg-hero">
          <div className="container download-grid">
            <div className="download-copy">
              <h1>Nhận việc nhà gần nơi bạn ở</h1>
              <p>
                Tasker dùng ứng dụng HomeService trên điện thoại để gửi hồ sơ,
                nhận lời mời, chụp ảnh check-in và theo dõi thu nhập. Website
                này chỉ dành cho khách đặt dịch vụ.
              </p>
              <div className="tg-cta">
                <DownloadButton />
              </div>
              <InstallHelp />
            </div>
            <DownloadQr />
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-head">
              <h2>Bốn bước để bắt đầu nhận việc</h2>
            </div>
            <ol className="steps">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <span className="step-num">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section section--tint" id="ho-so">
          <div className="container">
            <div className="section-head">
              <h2>Hồ sơ cần chuẩn bị</h2>
              <p>Đổi điểm làm việc hoặc bán kính sau này không cần duyệt lại nếu CCCD không đổi.</p>
            </div>
            <div className="tg-docs">
              {DOCS.map(({ Icon, title, text }) => (
                <div key={title} className="tg-doc">
                  <span className="svc-icon" style={{ background: "#fff", color: "var(--primary-dark)" }}>
                    <Icon size={22} />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="thu-nhap">
          <div className="container tg-money">
            <div className="section-head">
              <h2>Thu nhập và rút tiền</h2>
              <p>Mọi khoản đều hiện trong mục Ví của ứng dụng.</p>
            </div>
            <div className="tg-money-grid">
              <div className="tg-figure">
                <strong>80%</strong>
                <span>giá trị mỗi đơn về ví của bạn. Nền tảng giữ 20% phí dịch vụ.</span>
              </div>
              <ul className="tg-rules">
                <li>
                  <Wallet size={18} /> Đơn thanh toán online được cộng vào ví sau khi khách xác nhận hoặc sau 24 giờ nếu khách
                  không phản hồi.
                </li>
                <li>
                  <Wallet size={18} /> Đơn tiền mặt: bạn thu tiền của khách, phí dịch vụ được trừ từ số dư ví. Nạp ví từ
                  50.000 đ.
                </li>
                <li>
                  <Wallet size={18} /> Rút tiền về tài khoản ngân hàng từ 50.000 đ mỗi lần.
                </li>
                <li>
                  <CircleAlert size={18} /> Không đến đúng hẹn bị tính điểm vi phạm. Đủ 3 điểm, tài khoản tạm ngưng nhận việc 7
                  ngày.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
