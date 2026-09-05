import Document from "../components/document";
import NotFound from "./(vi)/not-found";

export const metadata = { title: "Không tìm thấy số báo · AI Morning" };
export default function GlobalNotFound() {
  return (
    <Document language="vi">
      <NotFound />
    </Document>
  );
}
