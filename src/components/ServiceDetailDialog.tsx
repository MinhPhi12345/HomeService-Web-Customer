// SRS v1.8 – nút ⓘ "Chi tiết dịch vụ": công việc bao gồm / không bao gồm / khách chuẩn bị / lưu ý, giá và cách tính số lượng
import { Check, Clock, ClipboardList, Info, Package, Tag, X } from "lucide-react";
import type { ServiceCategory } from "../types";
import Modal from "./Modal";
import ServiceBadge from "./ServiceBadge";
import { formatVND } from "../utils/format";
import { durationText, lines, qtyRange } from "../utils/service";

interface Props {
  service: ServiceCategory;
  onClose: () => void;
  /** Có thì hiện nút "Chọn dịch vụ này" */
  onChoose?: () => void;
  chooseLabel?: string;
}

const SECTIONS = [
  { key: "includes", title: "Công việc bao gồm", Icon: Check, tone: "ok" },
  { key: "excludes", title: "Không bao gồm", Icon: X, tone: "no" },
  { key: "customerPrepares", title: "Bạn cần chuẩn bị", Icon: Package, tone: "prep" },
  { key: "notes", title: "Lưu ý", Icon: Info, tone: "note" },
] as const;

export default function ServiceDetailDialog({ service: s, onClose, onChoose, chooseLabel = "Chọn dịch vụ này" }: Props) {
  const { min, max, fixed } = qtyRange(s);
  const per = s.minutesPerUnit ?? 60;
  const qtyText = fixed ? `${min} ${s.unit} mỗi đơn` : `${min}–${max} ${s.unit} mỗi đơn`;
  const durText =
    s.unit === "giờ" ? "Theo số giờ bạn chọn" : fixed ? `Khoảng ${durationText(per * min)}` : `Khoảng ${durationText(per)} / ${s.unit}`;

  return (
    <Modal
      title="Chi tiết dịch vụ"
      onClose={onClose}
      className="modal--svc"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Đóng
          </button>
          {onChoose && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onChoose();
                onClose();
              }}
            >
              {chooseLabel}
            </button>
          )}
        </>
      }
    >
      <div className="sd-head">
        <ServiceBadge name={s.name} iconUrl={s.iconUrl} size={24} />
        <div>
          <b>{s.name}</b>
          {s.description && <span>{s.description}</span>}
        </div>
      </div>

      <div className="sd-facts">
        <div>
          <Tag size={16} />
          <span>Đơn giá</span>
          <b>
            {formatVND(s.basePrice)} / {s.unit}
          </b>
        </div>
        <div>
          <ClipboardList size={16} />
          <span>Số lượng</span>
          <b>{qtyText}</b>
        </div>
        <div>
          <Clock size={16} />
          <span>Thời lượng</span>
          <b>{durText}</b>
        </div>
      </div>
      {s.quantityHint && <p className="hint sd-hint">{s.quantityHint}</p>}
      {s.requiresItemList && (
        <p className="sd-items-note">
          <ClipboardList size={15} /> Khi đặt, bạn ghi rõ từng hạng mục cần làm (mỗi hạng mục một dòng). Tasker chụp ảnh trước và sau
          theo từng hạng mục để bạn đối chiếu.
        </p>
      )}

      {SECTIONS.map(({ key, title, Icon, tone }) => {
        const list = lines(s[key]);
        if (!list.length) return null;
        return (
          <section key={key} className={`sd-sec sd-sec--${tone}`}>
            <h4>{title}</h4>
            <ul>
              {list.map((x, i) => (
                <li key={i}>
                  <Icon size={15} strokeWidth={2.6} />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </Modal>
  );
}
