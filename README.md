# AI Morning

AI Morning là bản tin AI hằng ngày bằng tiếng Việt, được build thành static site để xuất bản trên GitHub Pages. Nội dung từng edition nằm trong JSON; renderer chịu trách nhiệm kiểm tra dữ liệu, tạo trang bài viết, trang archive và sao chép assets sang bản xuất bản.

Trang đang xuất bản: [thuanlg-4135.github.io/ai-morning](https://thuanlg-4135.github.io/ai-morning/)

## Yêu cầu

- Node.js 20 trở lên

Project hiện không cần cài dependency để build.

## Chạy build

```bash
npm run build
```

Lệnh sẽ kiểm tra toàn bộ `content/*.json` rồi tạo static site trong `dist/`:

- `dist/index.html` — edition mới nhất
- `dist/YYYY-MM-DD/index.html` — mỗi edition theo ngày
- `dist/archive/index.html` — archive các edition
- `dist/assets/` — CSS, JavaScript, SVG và font self-hosted

`dist/` là output sinh ra tự động và không được commit.

## Thêm một edition

1. Sao chép edition JSON mới nhất trong `content/` thành `content/YYYY-MM-DD.json`.
2. Đặt `edition_date` trùng với tên file.
3. Cập nhật toàn bộ nội dung bằng JSON thuần, không chèn HTML.
4. Chạy `npm run build`.
5. Kiểm tra `dist/index.html`, `dist/YYYY-MM-DD/index.html` và `dist/archive/index.html`.

Schema, enum và ví dụ nested fields được mô tả tại [docs/content-schema.md](docs/content-schema.md).

## Cấu trúc repo

```text
assets/       CSS, JavaScript, SVG và font local
content/      Dữ liệu editorial cho từng ngày
docs/         Tài liệu schema nội dung
scripts/      Static-site renderer và SVG visual renderer
templates/    HTML shell cho article và archive
```

`scripts/build.mjs` xác thực schema trước khi ghi output. Nếu một trường bắt buộc, enum hoặc URL nguồn không hợp lệ, build sẽ dừng với lỗi chỉ rõ file/trường cần sửa.

## Typography và font

Site tự host các subset Latin và Vietnamese của Be Vietnam Pro (UI/headline) và Source Serif 4 (long-form reading). Không có request font CDN ở runtime. Chi tiết phiên bản, nguồn và giấy phép có trong [assets/fonts/README.md](assets/fonts/README.md).

## Deploy

Push lên nhánh `main` sẽ kích hoạt workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml): build bằng Node 24, upload `dist/` và deploy lên GitHub Pages.
