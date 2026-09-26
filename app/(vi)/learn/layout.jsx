import {
  SiteHeader as Header,
  SiteFooter as Footer,
} from "../../../components/layout/site-header";
import { getEditions } from "../../../lib/editions.mjs";
import "../../../components/learning/learning.css";

export default async function LearningLayout({ children }) {
  const editions = await getEditions();
  return (
    <>
      <Header language="vi" edition={editions[0]} compact />
      {children}
      <Footer language="vi" />
    </>
  );
}
