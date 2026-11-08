/**
 * Biểu tượng HomeService: ngôi nhà + dấu tích (dịch vụ hoàn tất, tin cậy) + tia sáng (sạch sẽ, chất lượng).
 * Cùng hình với icon ứng dụng di động và favicon.
 *  - variant "onPrimary": nhà trắng, đặt trên nền teal
 *  - variant "onLight":   nhà teal, đặt trên nền trắng
 */
const HOUSE =
  "M50 17.5C51.6 17.5 53.1 18.1 54.3 19.1L83.2 43.6C86.4 46.3 84.5 51.5 80.3 51.5L77 51.5L77 76C77 80.4 73.4 84 69 84L31 84C26.6 84 23 80.4 23 76L23 51.5L19.7 51.5C15.5 51.5 13.6 46.3 16.8 43.6L45.7 19.1C46.9 18.1 48.4 17.5 50 17.5Z";
const SPARK =
  "M80 10C80.9 16.2 83.8 19.1 90 20C83.8 20.9 80.9 23.8 80 30C79.1 23.8 76.2 20.9 70 20C76.2 19.1 79.1 16.2 80 10Z";

export default function BrandMark({
  size = 24,
  variant = "onPrimary",
}: {
  size?: number;
  variant?: "onPrimary" | "onLight";
}) {
  const house = variant === "onPrimary" ? "#FFFFFF" : "#13B5A5";
  const check = variant === "onPrimary" ? "#13B5A5" : "#FFFFFF";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g transform="translate(-2 -1)">
        <path d={HOUSE} fill={house} />
        <path
          d="M37 63.5L46.5 72.5L64 54"
          fill="none"
          stroke={check}
          strokeWidth={7.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d={SPARK} fill="#FFC247" />
        <circle cx="91" cy="33" r="2.6" fill="#FFC247" />
      </g>
    </svg>
  );
}
