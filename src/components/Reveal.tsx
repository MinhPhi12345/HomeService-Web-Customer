import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  /** Độ trễ (ms) để các phần tử cùng hàng hiện lần lượt */
  delay?: number;
  as?: "div" | "li" | "section" | "article";
  style?: CSSProperties;
  id?: string;
}

/** Hiện dần phần tử khi cuộn tới (IntersectionObserver). Tắt khi người dùng chọn giảm chuyển động. */
export default function Reveal({ children, className = "", delay = 0, as: Tag = "div", style, id }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      // @ts-expect-error ref dùng chung cho nhiều loại thẻ
      ref={ref}
      id={id}
      className={`reveal${shown ? " is-shown" : ""} ${className}`}
      style={{ ...style, transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
