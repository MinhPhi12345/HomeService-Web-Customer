import { Link } from "react-router-dom";
import { Lock, House, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import "../styles/auth.css";

interface Props {
  variant: "login" | "register";
  title: string;
  desc: string;
  footerNote: string;
  extra?: ReactNode;
  children: ReactNode;
}

/** Bố cục 2 cột dùng chung cho W02 Login và W06 Register */
export default function AuthShell({
  variant,
  title,
  desc,
  footerNote,
  extra,
  children,
}: Props) {
  return (
    <div className={`auth auth--${variant}`}>
      <aside className="auth-brand">
        <span className="auth-blob auth-blob--top" />
        <span className="auth-blob auth-blob--bottom" />
        <Link to="/" className="auth-logo" aria-label="HomeService – Trang chủ">
          <span className="auth-logo-mark">
            <House
              size={variant === "login" ? 23 : 21}
              color="#14b8a6"
              strokeWidth={2.2}
            />
          </span>
          <span>HomeService</span>
        </Link>
        <div className="auth-brand-body">
          <h2>{title}</h2>
          <p>{desc}</p>
          {extra}
        </div>
        <div className="auth-brand-foot">
          <Lock size={variant === "login" ? 16 : 14} /> {footerNote}
        </div>
      </aside>
      <main className="auth-form-side">{children}</main>
    </div>
  );
}

export type { LucideIcon };
