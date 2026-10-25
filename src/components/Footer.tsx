import { House } from "lucide-react";

const cols = [
  {
    title: "Dịch vụ",
    items: ["Dọn dẹp nhà", "Giặt ủi", "Nấu ăn", "Vệ sinh máy lạnh"],
  },
  { title: "Công ty", items: ["Về chúng tôi", "Tuyển dụng", "Blog"] },
  {
    title: "Hỗ trợ",
    items: [
      "Câu hỏi thường gặp",
      "Giải quyết khiếu nại",
      "Điều khoản sử dụng",
      "Chính sách bảo mật",
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <House size={29} color="#14b8a6" strokeWidth={2.2} /> HomeService
            </div>
            <p className="footer-about">
              Nền tảng kết nối dịch vụ tại nhà.
              <br />
              Nhóm 15 – Công nghệ phần mềm nâng cao.
            </p>
          </div>
          {cols.map((c) => (
            <div className="footer-col" key={c.title}>
              <h4>{c.title}</h4>
              {c.items.map((i) => (
                <a key={i} href="#" onClick={(e) => e.preventDefault()}>
                  {i}
                </a>
              ))}
            </div>
          ))}
        </div>
        <p className="footer-copy">© 2026 HomeService – Nhóm 15</p>
      </div>
    </footer>
  );
}
