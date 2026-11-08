// FR-32, FR-33 – "Ưu đãi của tôi": quà tặng riêng và mã khuyến mãi đang dùng được
import { useEffect, useState } from "react";
import { Copy, Gift, Ticket } from "lucide-react";
import { voucherService } from "../services/bookingService";
import { getErrorMessage } from "../services/api";
import type { MyVoucher } from "../types";
import { SOURCE_LABEL, conditionLabel, discountLabel } from "../utils/voucher";

export function VoucherCard({ v, action }: { v: MyVoucher; action?: React.ReactNode }) {
  return (
    <div className={`voucher ${v.isGift ? "voucher--gift" : ""}`}>
      <span className="voucher-icon" aria-hidden="true">
        {v.isGift ? <Gift size={20} /> : <Ticket size={20} />}
      </span>
      <div className="voucher-body">
        <span className="voucher-tag">{SOURCE_LABEL[v.source] ?? "Khuyến mãi"}</span>
        <b>{discountLabel(v)}</b>
        <span className="voucher-name">{v.name}</span>
        <span className="hint">{conditionLabel(v)}</span>
        <span className="hint">
          Mã <code className="voucher-code">{v.code}</code>
          {v.remainingUses > 1 ? ` · còn ${v.remainingUses} lượt` : ""}
        </span>
      </div>
      {action && <div className="voucher-action">{action}</div>}
    </div>
  );
}

export default function MyVouchers({ onUse }: { onUse?: (v: MyVoucher) => void }) {
  const [items, setItems] = useState<MyVoucher[] | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    voucherService
      .mine()
      .then(setItems)
      .catch((e) => setError(getErrorMessage(e)));
  }, []);

  if (error) return <div className="notice notice--danger">{error}</div>;
  if (!items) return <div className="skeleton" style={{ height: 160 }} />;
  if (items.length === 0)
    return (
      <div className="empty">
        <Gift size={28} />
        <p>Bạn chưa có ưu đãi nào. Quà tặng sẽ xuất hiện ở đây khi bạn xác thực email, hoàn tất mỗi 5 đơn, hoặc khi HomeService có chương trình khuyến mãi.</p>
      </div>
    );

  return (
    <div className="voucher-list">
      <p className="hint">Mã giảm giá áp dụng cho đơn thanh toán trước (ví điện tử, thẻ). Nhập mã ở bước “Liên hệ và thanh toán” khi đặt dịch vụ.</p>
      {items.map((v) => (
        <VoucherCard
          key={v.id}
          v={v}
          action={
            onUse ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => onUse(v)}>
                Dùng
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  void navigator.clipboard?.writeText(v.code).catch(() => undefined);
                  setCopied(v.id);
                  window.setTimeout(() => setCopied(null), 1500);
                }}
              >
                <Copy size={14} /> {copied === v.id ? "Đã chép" : "Chép mã"}
              </button>
            )
          }
        />
      ))}
    </div>
  );
}
