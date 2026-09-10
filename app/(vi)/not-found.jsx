import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="not-found-code" aria-hidden="true">
        404
      </div>
      <section className="not-found-copy" aria-labelledby="not-found-title">
        <span className="eyebrow">AI MORNING / LẠC SỐ BÁO</span>
        <h1 id="not-found-title">Số báo này đi lạc rồi.</h1>
        <p>
          Có thể đường dẫn đã thay đổi hoặc số báo chưa tồn tại. Quay về bản mới nhất
          rồi tiếp tục đọc từ đó.
        </p>
        <Link className="primary-button" href="/">
          Về số mới nhất ↗
        </Link>
      </section>
    </main>
  );
}
