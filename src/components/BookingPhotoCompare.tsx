// SRS v1.8 – ảnh trước (lúc bắt đầu) và sau (lúc hoàn thành) đặt cạnh nhau, theo từng hạng mục nếu đơn có hạng mục
import { Camera } from "lucide-react";
import type { BookingItemDto, BookingPhotoDto } from "../types";
import { mediaUrl } from "../utils/media";

interface Props {
  items: BookingItemDto[];
  photos: BookingPhotoDto[];
}

function Thumbs({ list, label }: { list: BookingPhotoDto[]; label: string }) {
  if (!list.length)
    return (
      <div className="pc-empty">
        <Camera size={20} />
        <span>Chưa có ảnh</span>
      </div>
    );
  return (
    <div className="pc-thumbs">
      {list.map((p, i) => (
        <a key={`${p.url}-${i}`} href={mediaUrl(p.url)} target="_blank" rel="noreferrer" title={p.note ?? label}>
          <img src={mediaUrl(p.url)} alt={`${label} ${i + 1}`} loading="lazy" />
        </a>
      ))}
    </div>
  );
}

function Pair({ before, after, title }: { before: BookingPhotoDto[]; after: BookingPhotoDto[]; title: string }) {
  return (
    <div className="pc-row">
      <div className="pc-col">
        <span className="pc-tag">Trước</span>
        <Thumbs list={before} label={`${title} – trước`} />
      </div>
      <div className="pc-col">
        <span className="pc-tag pc-tag--after">Sau</span>
        <Thumbs list={after} label={`${title} – sau`} />
      </div>
    </div>
  );
}

export default function BookingPhotoCompare({ items, photos }: Props) {
  const pick = (stage: 0 | 1, itemNo: number | null) => photos.filter((p) => p.stage === stage && p.itemNo === itemNo);

  if (!items.length) return <Pair before={photos.filter((p) => p.stage === 0)} after={photos.filter((p) => p.stage === 1)} title="Ảnh" />;

  const otherBefore = pick(0, null);
  const otherAfter = pick(1, null);
  return (
    <div className="pc-list">
      {items.map((it) => (
        <div key={it.itemNo} className="pc-item">
          <div className="pc-title">
            <span className="pc-no">{it.itemNo}</span>
            <span>{it.description}</span>
          </div>
          <Pair before={pick(0, it.itemNo)} after={pick(1, it.itemNo)} title={`Hạng mục ${it.itemNo}`} />
        </div>
      ))}
      {(otherBefore.length > 0 || otherAfter.length > 0) && (
        <div className="pc-item">
          <div className="pc-title">
            <span>Ảnh chung</span>
          </div>
          <Pair before={otherBefore} after={otherAfter} title="Ảnh chung" />
        </div>
      )}
    </div>
  );
}
