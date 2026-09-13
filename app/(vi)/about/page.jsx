import { Header, Footer } from "../../../components/newspaper";
import { getEditions } from "../../../lib/editions.mjs";
import { pageMetadata } from "../../../lib/metadata.mjs";
import "../../learning.css";

export const metadata = pageMetadata({
  title: "Về AI Morning · Dữ liệu & góp ý",
  description:
    "Cách AI Morning biên soạn tin, lưu tùy chọn đọc trên thiết bị và tiếp nhận góp ý.",
  path: "/about/",
});

export default async function AboutPage() {
  const editions = await getEditions();
  return (
    <>
      <Header
        language="vi"
        edition={editions[0]}
        archive
        activeSection="about"
      />
      <main id="main-content" className="shell learn-main">
        <article className="learn-article">
          <header>
            <span className="eyebrow">VỀ AI MORNING</span>
            <h1>Đọc có nguồn. Góp ý có chỗ.</h1>
            <p className="learn-summary">
              AI Morning chọn lọc tin AI và công cụ cho người làm phần mềm. Mỗi
              bài giúp bạn hiểu điều gì thay đổi và có đáng thử trong công việc
              hay không.
            </p>
          </header>
          <section>
            <h2>Cách biên soạn</h2>
            <p>
              Nội dung có AI hỗ trợ nghiên cứu và biên soạn. Các bài dẫn nguồn
              gốc để bạn kiểm tra; phần nhận định và gợi ý thực hành là góc nhìn
              của AI Morning. Nội dung vẫn có thể sai hoặc chậm cập nhật. Trước
              khi áp dụng, hãy mở nguồn và kiểm tra phiên bản, giá, điều kiện sử
              dụng.
            </p>
          </section>
          <section id="privacy">
            <h2>Dữ liệu trên thiết bị của bạn</h2>
            <p>
              Website lưu giao diện sáng/tối, cỡ chữ, chế độ đọc và danh sách
              bài đã lưu trong trình duyệt bằng localStorage. Những tùy chọn này
              không được ứng dụng gửi về máy chủ và không tự đồng bộ sang thiết
              bị khác.
            </p>
            <p>
              Mã website hiện không cài công cụ analytics, quảng cáo hay cookie
              theo dõi. GitHub Pages phục vụ website và có thể ghi nhận thông
              tin truy cập theo{" "}
              <a
                href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "underline",
                  textUnderlineOffset: "0.2em",
                }}
              >
                chính sách quyền riêng tư của GitHub
              </a>
              . Khi bạn mở nguồn hoặc tải hình từ website bên ngoài, nhà cung
              cấp đó nhận yêu cầu truy cập theo chính sách riêng.
            </p>
            <p>
              Để xóa tùy chọn và bài đã lưu, mở phần cài đặt dữ liệu trang web
              của trình duyệt và xóa dữ liệu cho thuanlg-4135.github.io. Thao
              tác này cũng có thể xóa tùy chọn của các trang khác trên cùng tên
              miền. Bạn vẫn đọc được tin nếu chặn lưu trữ.
            </p>
          </section>
          <section id="contact">
            <h2>Góp ý hoặc báo lỗi</h2>
            <p>
              Bạn thấy một nguồn sai, thông tin cũ hay lỗi giao diện? Gửi đường
              dẫn bài, mô tả ngắn và ảnh chụp nếu có qua{" "}
              <a
                href="https://github.com/thuanlg-4135/ai-morning/issues"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "underline",
                  textUnderlineOffset: "0.2em",
                }}
              >
                GitHub Issues của AI Morning
              </a>
              . Cần tài khoản GitHub để gửi; nội dung góp ý sẽ công khai, nên
              đừng đính kèm mật khẩu hoặc dữ liệu nội bộ.
            </p>
          </section>
        </article>
      </main>
      <Footer language="vi" />
    </>
  );
}
