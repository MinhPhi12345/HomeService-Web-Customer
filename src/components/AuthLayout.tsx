import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Check, House, Lock } from "lucide-react";
import { iconForService } from "./ServiceIcon";
import "../styles/auth.css";

const CHIP_SERVICES = ["Dọn dẹp nhà", "Giặt ủi", "Nấu ăn", "Sửa điện nước"];

interface Props {
  /** Tiêu đề lớn ở khung màu bên trái */
  title: string;
  desc: string;
  /** "chips": hàng icon dịch vụ · "checks": danh sách lợi ích */
  extra?: "chips" | "checks";
  footNote: string;
  children: ReactNode;
}

/** Bố cục Đăng nhập / Đăng ký: khung thương hiệu bên trái, form bên phải */
export default function AuthLayout({ title, desc, extra = "chips", footNote, children }: Props) {
  return (
    <div className="auth">
      <aside className="auth-brand">
        <span className="auth-blob auth-blob--top" aria-hidden="true" />
        <span className="auth-blob auth-blob--bottom" aria-hidden="true" />
        <Link to="/" className="auth-logo" aria-label="HomeService – Trang chủ">
          <span className="auth-logo-mark">
            <House size={22} strokeWidth={2.4} />
          </span>
          HomeService
        </Link>
        <div className="auth-brand-body">
          <h2>{title}</h2>
          <p>{desc}</p>
          {extra === "chips" ? (
            <div className="auth-chips" aria-hidden="true">
              {CHIP_SERVICES.map((n) => {
                const { Icon } = iconForService(n);
                return (
                  <span key={n} className="auth-chip" title={n}>
                    <Icon size={26} />
                  </span>
                );
              })}
            </div>
          ) : (
            <ul className="auth-checks">
              <li>
                <Check size={17} strokeWidth={3} /> Giá niêm yết, không phụ thu
              </li>
              <li>
                <Check size={17} strokeWidth={3} /> Tasker được xác thực hồ sơ CCCD
              </li>
              <li>
                <Check size={17} strokeWidth={3} /> Tiền chỉ chuyển khi bạn xác nhận
              </li>
            </ul>
          )}
        </div>
        <p className="auth-brand-foot">
          <Lock size={15} /> {footNote}
        </p>
      </aside>

      <main className="auth-side">
        <Link to="/" className="auth-logo auth-logo--mobile" aria-label="HomeService – Trang chủ">
          <span className="auth-logo-mark">
            <House size={20} strokeWidth={2.4} />
          </span>
          HomeService
        </Link>
        <div className="auth-form-wrap">
          {children}
          <Link to="/tasker-guide" className="auth-tasker">
            <Briefcase size={17} />
            <span>
              Muốn làm Tasker? <b>Xem cách đăng ký trên ứng dụng</b>
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
