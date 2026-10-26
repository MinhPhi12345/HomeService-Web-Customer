import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({ title, onClose, children, footer }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-top">
          <h3 className="modal-title">{title}</h3>
          <button
            type="button"
            className="icon-btn"
            aria-label="Đóng"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/** Thông báo nổi tự ẩn sau 4 giây */
export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <span>{message}</span>
      <button type="button" onClick={onClose}>
        Đóng
      </button>
    </div>
  );
}
