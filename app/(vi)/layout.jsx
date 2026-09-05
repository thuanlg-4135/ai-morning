import Document, { metadata } from "../../components/document";
export { metadata };
export default function Layout({ children }) {
  return <Document language="vi">{children}</Document>;
}
