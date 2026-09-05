# AI Morning

Bản tin AI bằng tiếng Việt cho người làm phần mềm. Next.js App Router dựng sẵn các số báo từ JSON và xuất HTML tĩnh để chạy trên GitHub Pages.

Trang xuất bản: [thuanlg-4135.github.io/ai-morning](https://thuanlg-4135.github.io/ai-morning/)

## Phát triển

Cần Node.js 20.9 trở lên (CI dùng Node 24).

```bash
npm ci
npm run dev
```

Mở **http://localhost:3000/ai-morning/**. Chỉnh giao diện trong `app/globals.css` và `components/`; nội dung giữ trong `content/YYYY-MM-DD.json`.

## Build và xem bản xuất

```bash
npm run build
npm run preview
```

Mở **http://localhost:8080/ai-morning/**. Lệnh preview phục vụ chính bản tĩnh trong `dist/`, bao gồm đường dẫn con của GitHub Pages.

Build chạy regression tests, kiểm tra chất lượng và ledger, tạo static export bằng Next.js, rồi kiểm tra nội dung, liên kết và assets của mọi trang. Build không tự sửa ledger.

- `/` — số mới nhất
- `/YYYY-MM-DD/` — số báo theo ngày
- `/archive/` — tìm số báo và xem bài đã lưu
- `/en/`, `/en/YYYY-MM-DD/`, `/en/archive/` — chỉ các số có bản dịch đã duyệt

Các đường dẫn trên nằm dưới `/ai-morning` theo mặc định. Nếu đổi sang domain gốc, đặt `NEXT_PUBLIC_BASE_PATH=''` khi chạy dev, build và preview. Không cần server Next.js ở môi trường xuất bản.

## Trải nghiệm đọc

- Bố cục báo buổi sáng, font tiếng Việt tự host, giao diện sáng/tối/tự động.
- Chế độ đọc tập trung, tăng cỡ chữ, thanh tiến độ đọc và chuyển động nhẹ với Motion.
- Tôn trọng `prefers-reduced-motion`; nội dung và liên kết vẫn dùng được khi tắt JavaScript.
- Lưu bài trên trình duyệt và tìm lại trong archive; không cần tài khoản.
- Checklist developer theo phiên đọc; tải lại trang sẽ đặt lại checklist.
- Mỗi sự kiện giữ nguồn, thời gian, bối cảnh và khuyến nghị riêng.

## Thêm một số báo

1. Đọc [AGENTS.md](AGENTS.md), kiểm tra `data/news-index.json`, nghiên cứu từ danh sách ứng viên trống.
2. Tạo `content/YYYY-MM-DD.json` theo [schema](docs/content-schema.md).
3. Chạy `npm run test:news`, `npm run news:index`, `npm run news:check`, rồi `npm run build`.
4. Chạy `npm run preview`, kiểm tra trang mới nhất, trang theo ngày và archive.
5. Commit JSON cùng ledger. Các lần cập nhật nội dung bình thường không cần sửa giao diện.

## Kiểm tra giao diện

```bash
npx playwright install chromium
npm run test:browser
npm run format:check
```

Chạy `npm run build` trước browser tests. Playwright kiểm tra mọi route ở 360, 412, 768, 1440 và 1920px; kiểm tra ảnh, lỗi trình duyệt, tìm kiếm, lưu bài, tùy chọn đọc, ngôn ngữ và chế độ không JavaScript. Ảnh kiểm tra được lưu trong `.verification/pages/`.

## Cấu trúc

```text
app/          Routes Next.js, layout theo ngôn ngữ và CSS
components/   Giao diện báo; client components cho tương tác
lib/          Đọc JSON, bản dịch và cấu hình đường dẫn
assets/       Ảnh minh họa, SVG, font và giấy phép
content/      Nội dung biên tập theo ngày
data/         Event ledger chống trùng qua các số
scripts/news/ Các kiểm tra schema, freshness, evidence và dedupe
scripts/      CLI chất lượng, SVG renderer, chuẩn bị assets và preview
tests/       Regression, static export và browser tests
```

`public/assets/`, `.next/`, `out/` và `dist/` được tạo tự động, không commit. Font Be Vietnam Pro và Source Serif 4 cùng giấy phép nằm trong [assets/fonts](assets/fonts/README.md).

## Xuất bản

Push lên `main` kích hoạt [GitHub Actions](.github/workflows/pages.yml): `npm ci`, kiểm tra dữ liệu, build và upload `dist/` lên Pages. Chi tiết ở [docs/publishing.md](docs/publishing.md).
