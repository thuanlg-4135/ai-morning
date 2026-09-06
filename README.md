# AI Morning

**Bản tin AI và công nghệ hằng ngày bằng tiếng Việt, dành cho kỹ sư phần mềm.**

AI Morning giúp bạn nắm được điều gì vừa thay đổi, vì sao nó ảnh hưởng đến công việc và nên kiểm tra gì tiếp theo. Mỗi số báo ưu tiên tin mới có nguồn kiểm chứng, phân biệt sự kiện với nhận định và tránh lặp lại tin cũ.

[Đọc số mới nhất](https://thuanlg-4135.github.io/ai-morning/) · [Kho bản tin](https://thuanlg-4135.github.io/ai-morning/archive/) · [Hướng dẫn biên tập](AGENTS.md)

## Trải nghiệm đọc

- Giao diện báo buổi sáng, hỗ trợ điện thoại và máy tính, với font tiếng Việt tự host.
- Chế độ sáng, tối hoặc theo hệ thống; tùy chọn đọc tập trung, tăng cỡ chữ và theo dõi tiến độ đọc.
- Lưu bài ngay trên trình duyệt và tìm lại trong kho bản tin, không cần tài khoản.
- Checklist dành cho developer trong từng phiên đọc; tải lại trang sẽ đặt lại checklist.
- Nội dung và liên kết vẫn dùng được khi tắt JavaScript; chuyển động tôn trọng `prefers-reduced-motion`.
- Các số có bản dịch tiếng Anh đã duyệt được xuất bản thêm tại `/en/`.

## Chạy trên máy

Cần **Node.js 20.9 trở lên** và npm. GitHub Actions dùng Node.js 24.

```bash
git clone https://github.com/thuanlg-4135/ai-morning.git
cd ai-morning
npm ci
npm run dev
```

Mở [localhost:3000/ai-morning/](http://localhost:3000/ai-morning/).

Nội dung nằm trong `content/YYYY-MM-DD.json`. Để chỉnh giao diện, xem `components/`, `app/` và `app/globals.css`.

## Cách dự án hoạt động

Dự án dùng **Next.js App Router, React và Motion**. Mỗi số báo là một tệp JSON; quá trình build kiểm tra dữ liệu rồi tạo HTML tĩnh để xuất bản trên GitHub Pages. Môi trường xuất bản không cần máy chủ Next.js.

```text
content/YYYY-MM-DD.json + data/news-index.json
                    ↓
       Kiểm tra chất lượng và schema
                    ↓
       Next.js dựng các trang từ JSON
                    ↓
            out/ → dist/
                    ↓
              GitHub Pages
```

| Đường dẫn | Nội dung |
| --- | --- |
| `/` | Số báo mới nhất |
| `/YYYY-MM-DD/` | Số báo theo ngày |
| `/archive/` | Tìm số báo và xem bài đã lưu |
| `/en/`, `/en/YYYY-MM-DD/`, `/en/archive/` | Các số có bản dịch tiếng Anh đã duyệt |

Tất cả đường dẫn mặc định nằm dưới `/ai-morning`.

## Thêm hoặc cập nhật số báo

Đọc [AGENTS.md](AGENTS.md) và các quy tắc được dẫn từ đó trước khi biên tập. [Hợp đồng dữ liệu](docs/content-schema.md) mô tả cấu trúc JSON; [kế hoạch pipeline](docs/news-pipeline-plan.md) mô tả quy trình nghiên cứu và tạo bản tin.

1. Tra cứu `data/news-index.json` để nhận diện sự kiện đã đăng. Với số mới, bắt đầu từ danh sách ứng viên trống.
2. Nghiên cứu trực tiếp từ các nguồn, kiểm chứng thời gian xuất bản, nội dung và URL gốc. Tham khảo [danh sách nguồn](config/news-sources.json).
3. Tạo hoặc sửa `content/YYYY-MM-DD.json`. Mỗi sự kiện nằm ở một mục chính; chỉ đăng lại khi có cập nhật đáng kể đã được kiểm chứng. Ưu tiên ít tin có giá trị hơn là thêm tin cho đủ mục.
4. Chạy đầy đủ các bước kiểm tra:

   ```bash
   npm run test:news
   npm run news:index
   npm run news:check
   npm run build
   ```

5. Chạy `npm run preview`, kiểm tra trang mới nhất, từng trang theo ngày vừa sửa và kho bản tin.
6. Commit JSON cùng `data/news-index.json` đã cập nhật.

Một lần cập nhật bản tin thông thường chỉ thay đổi dữ liệu. Chỉ sửa giao diện, runtime, validator hoặc schema khi công việc yêu cầu thay đổi các phần đó. Không bỏ qua kiểm tra để bản tin vượt qua build.

## Build và kiểm tra

Để tạo và xem bản tĩnh sẽ được xuất bản:

```bash
npm run build
npm run preview
```

Mở [localhost:8080/ai-morning/](http://localhost:8080/ai-morning/). Preview phục vụ trực tiếp thư mục `dist/`.

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy môi trường phát triển |
| `npm run test:news` | Chạy bộ kiểm thử hồi quy cho dữ liệu bản tin |
| `npm run news:index` | Kiểm tra dữ liệu và tạo lại sổ sự kiện chống trùng |
| `npm run news:check` | Kiểm tra chất lượng và phát hiện sổ sự kiện chưa cập nhật, không ghi lại tệp |
| `npm run build` | Chạy kiểm thử bản tin, kiểm tra dữ liệu, xuất trang tĩnh và kiểm thử bản xuất |
| `npm run preview` | Xem bản tĩnh trong `dist/` |
| `npm run test:export` | Kiểm thử nội dung, liên kết và assets của bản xuất đã tạo |
| `npm run test:browser` | Kiểm tra bản xuất bằng Playwright |
| `npm run format:check` | Kiểm tra định dạng mã nguồn trong các đường dẫn đã cấu hình |

Build không tự tạo lại sổ sự kiện. Nếu kiểm tra báo sổ chưa cập nhật, chạy `npm run news:index`, xem lại thay đổi rồi build lại. Nếu dữ liệu không hợp lệ, sửa lỗi trong JSON theo thông báo kiểm tra.

Sau khi thay đổi giao diện hoặc định tuyến, chạy thêm:

```bash
npx playwright install chromium
npm run test:browser
npm run format:check
```

Chạy build trước các kiểm thử trình duyệt. Playwright kiểm tra các route ở độ rộng 360, 412, 768, 1440 và 1920px, cùng chức năng tìm kiếm, lưu bài, tùy chọn đọc, chuyển ngôn ngữ và đọc khi tắt JavaScript. Xem ảnh kiểm tra trong `.verification/pages/` trước khi bàn giao.

## Cấu trúc thư mục

```text
app/                Routes Next.js, layout theo ngôn ngữ và CSS
components/         Giao diện báo và các thành phần tương tác
lib/                Đọc JSON, bản dịch và cấu hình đường dẫn
content/            Nội dung biên tập theo ngày
config/             Danh sách nguồn nghiên cứu
data/               Sổ sự kiện chống trùng giữa các số
assets/             Ảnh minh họa, SVG, font và giấy phép font
scripts/news/       Kiểm tra schema, độ mới, bằng chứng và trùng lặp
scripts/            Công cụ kiểm tra, xử lý assets và preview
tests/              Kiểm thử hồi quy, bản xuất tĩnh và trình duyệt
docs/               Hợp đồng dữ liệu, quy tắc biên tập và xuất bản
.github/workflows/  Quy trình kiểm tra và triển khai GitHub Pages
```

`public/assets/`, `.next/`, `out/` và `dist/` được tạo tự động, không commit. Thông tin về font Be Vietnam Pro, Source Serif 4 và giấy phép nằm trong [assets/fonts/README.md](assets/fonts/README.md).

## Xuất bản

Push lên `main` kích hoạt [workflow GitHub Pages](.github/workflows/pages.yml). Workflow cài dependencies từ lockfile, cập nhật sổ sự kiện, build, chạy kiểm thử trình duyệt rồi triển khai `dist/`. Bạn cũng có thể chạy workflow thủ công từ GitHub Actions.

Trong phần cài đặt Pages của repository, chọn **GitHub Actions** làm nguồn xuất bản. Xem [hướng dẫn xuất bản](docs/publishing.md) để biết chi tiết.

Nếu phục vụ website ở domain gốc, đặt `NEXT_PUBLIC_BASE_PATH=''` nhất quán khi chạy dev, build và preview. Ví dụ trên Bash:

```bash
NEXT_PUBLIC_BASE_PATH='' npm run build
NEXT_PUBLIC_BASE_PATH='' npm run preview
```

Khi đó, bản preview nằm tại `http://localhost:8080/`. Thay đổi đường dẫn gốc cần build lại vì Next.js đưa cấu hình này vào các tệp JavaScript được xuất.
