// Ô nhập mã OTP 6 số (tự chuyển ô, dán cả mã)
import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import "../styles/otp.css";

const LENGTH = 6;

interface Props {
  value: string;
  onChange: (code: string) => void;
  /** Gọi khi nhập đủ 6 số */
  onComplete?: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
}

export default function OtpInput({ value, onChange, onComplete, disabled, invalid, autoFocus = true }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const update = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, LENGTH);
    onChange(clean);
    if (clean.length === LENGTH) onComplete?.(clean);
  };

  const setAt = (i: number, d: string) => {
    const arr = digits.slice();
    arr[i] = d;
    // bỏ khoảng trống giữa chừng để chuỗi luôn liền mạch
    update(arr.join(""));
  };

  const onInput = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, "");
    if (!d) return;
    if (d.length > 1) {
      // gõ nhanh / tự điền từ SMS-email: điền tiếp từ ô hiện tại
      update((value.slice(0, i) + d).slice(0, LENGTH));
      refs.current[Math.min(i + d.length, LENGTH - 1)]?.focus();
      return;
    }
    setAt(i, d);
    if (i < LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        update(value.slice(0, i) + value.slice(i + 1));
      } else if (i > 0) {
        update(value.slice(0, i - 1) + value.slice(i));
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const d = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!d) return;
    e.preventDefault();
    update(d);
    refs.current[Math.min(d.length, LENGTH - 1)]?.focus();
  };

  return (
    <div className={`otp${invalid ? " otp--invalid" : ""}`} role="group" aria-label="Mã OTP 6 số">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="otp-box"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={LENGTH}
          aria-label={`Số thứ ${i + 1}`}
          value={d}
          disabled={disabled}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
