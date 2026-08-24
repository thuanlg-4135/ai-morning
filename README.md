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

1. Đọc quy trình nghiên cứu và chống trùng trong [AGENTS.md](AGENTS.md).
2. Kiểm tra `data/news-index.json`, rồi nghiên cứu từ một candidate list trống; không sao chép edition cũ.
3. Tạo `content/YYYY-MM-DD.json` với `edition_date` trùng tên file, event ID ổn định và nguồn trực tiếp.
4. Chạy `npm run test:news`.
5. Chạy `npm run news:index` để validate và cập nhật event ledger một cách tường minh.
6. Chạy `npm run news:check` rồi `npm run build`.
7. Kiểm tra `dist/index.html`, `dist/YYYY-MM-DD/index.html` và `dist/archive/index.html`.

## News quality commands

```bash
npm run news:index  # validate content and regenerate data/news-index.json
npm run news:check  # validate content and confirm the index is current
npm run test:news   # node:test regression suite cho schema, freshness, dedupe và ledger
npm run build       # test:news + news:check, then build the static site
```

Build bị chặn nếu một sự kiện xuất hiện ở nhiều section, một URL canonical được dùng cho các event khác nhau, nội dung cũ quay lại mà không có material update, nguồn hoặc ngày xuất bản bị thiếu, hay copy chỉ là fragment. Độ dài bất thường và lặp theme biên tập là warning, không tự làm build fail.

Schema, enum và ví dụ nested fields được mô tả tại [docs/content-schema.md](docs/content-schema.md).

## Cấu trúc repo

```text
assets/       CSS, JavaScript, SVG và font local
content/      Dữ liệu editorial cho từng ngày
data/         Event ledger sinh tự động để chống trùng qua nhiều ngày
docs/         Tài liệu schema nội dung
scripts/      Static-site renderer, SVG visual renderer và các module news-quality tập trung
templates/    HTML shell cho article và archive
```

`scripts/build.mjs` xác thực schema trước khi ghi output. Nếu một trường bắt buộc, enum hoặc URL nguồn không hợp lệ, build sẽ dừng với lỗi chỉ rõ file/trường cần sửa.

## Typography và font

Site tự host các subset Latin và Vietnamese của Be Vietnam Pro (UI/headline) và Source Serif 4 (long-form reading). Không có request font CDN ở runtime. Chi tiết phiên bản, nguồn và giấy phép có trong [assets/fonts/README.md](assets/fonts/README.md).

## Deploy

Push lên nhánh `main` sẽ kích hoạt workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml): build bằng Node 24, upload `dist/` và deploy lên GitHub Pages.
