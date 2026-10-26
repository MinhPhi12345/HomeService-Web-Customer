import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Navbar";
import { APP_DOWNLOAD } from "../utils/appConfig";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo light />
          <p>
            Đặt người giúp việc nhà tại TP.HCM. Thanh toán được tạm
            giữ cho đến khi bạn xác nhận công việc đã xong.
          </p>
        </div>
        <div>
          <h4>Khách hàng</h4>
          <Link to="/booking/new">Đặt dịch vụ</Link>
          <Link to="/bookings">Đơn của tôi</Link>
          <a href="/#dich-vu">Bảng giá</a>
          <a href="/#hoi-dap">Câu hỏi thường gặp</a>
          <a href={APP_DOWNLOAD.apkUrl} download>
            Tải ứng dụng Android
          </a>
        </div>
        <div>
          <h4>Tasker</h4>
          <Link to="/tasker-guide">Trở thành Tasker</Link>
          <Link to="/tasker-guide#ho-so">Hồ sơ cần chuẩn bị</Link>
          <Link to="/tasker-guide#thu-nhap">Thu nhập &amp; rút tiền</Link>
        </div>
        <div>
          <h4>Liên hệ</h4>
          <span>
            <Phone size={15} /> 1900 6868
          </span>
          <span>
            <Mail size={15} /> hotro@homeservice.vn
          </span>
          <span>
            <MapPin size={15} /> TP. Hồ Chí Minh
          </span>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} HomeService · Đồ án Nhóm 15</span>
        <span>Bản đồ © OpenStreetMap contributors</span>
      </div>
    </footer>
  );
}
