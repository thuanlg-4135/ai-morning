import Link from "next/link";
export default function NotFound() {
  return (
    <main className="not-found">
      <span className="eyebrow">AI MORNING / 404</span>
      <h1>Số báo này chưa có.</h1>
      <p>Có thể đường dẫn đã thay đổi. Mời bạn đọc số mới nhất.</p>
      <Link className="primary-button" href="/">
        Về trang chủ ↗
      </Link>
    </main>
  );
}
