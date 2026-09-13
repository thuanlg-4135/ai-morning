import Document from "../components/document";
import NotFound from "./(vi)/not-found";

export const metadata = {
  title: "Không tìm thấy số báo · AI Morning",
  description:
    "Đường dẫn này chưa có số báo. Quay về AI Morning để đọc số mới nhất.",
  robots: { index: false, follow: true },
};
export default function GlobalNotFound() {
  return (
    <Document language="vi">
      <NotFound />
    </Document>
  );
}
