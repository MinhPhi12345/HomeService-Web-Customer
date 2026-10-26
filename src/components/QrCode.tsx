import { useMemo } from "react";
import qrcode from "qrcode-generator";

/** Mã QR dạng SVG (tạo ngay trên trình duyệt, không gọi dịch vụ ngoài) */
export default function QrCode({ value, size = 168 }: { value: string; size?: number }) {
  const svg = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }, [value]);
  return (
    <div
      className="qr"
      style={{ width: size, height: size }}
      role="img"
      aria-label="Mã QR tải ứng dụng"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
