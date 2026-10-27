import { useState } from "react";
import { iconForService } from "./ServiceIcon";
import { mediaUrl } from "../utils/media";

interface Props {
  name: string;
  /** Ảnh dịch vụ do Admin tải lên – không có / lỗi thì dùng icon theo tên dịch vụ */
  iconUrl?: string | null;
  size?: number;
  className?: string;
}

/** Ô biểu tượng dịch vụ: ưu tiên ảnh Admin tải lên, dự phòng icon màu theo tên. */
export default function ServiceBadge({ name, iconUrl, size = 22, className = "svc-icon" }: Props) {
  const [failed, setFailed] = useState<string | null>(null);
  const src = mediaUrl(iconUrl);
  const { Icon, bg, fg } = iconForService(name);

  if (src && failed !== src) {
    return (
      <span className={`${className} svc-icon--img`} style={{ background: bg }}>
        <img src={src} alt="" loading="lazy" onError={() => setFailed(src)} />
      </span>
    );
  }
  return (
    <span className={className} style={{ background: bg, color: fg }}>
      <Icon size={size} />
    </span>
  );
}
