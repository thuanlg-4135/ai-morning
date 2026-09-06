import { Header, Footer } from "../../../components/newspaper";
import { getEditions } from "../../../lib/editions.mjs";
import "../../learning.css";

export default async function LearningLayout({ children }) {
  const editions = await getEditions();
  return (
    <>
      <Header
        language="vi"
        edition={editions[0]}
        archive
        activeSection="learn"
      />
      {children}
      <Footer language="vi" />
    </>
  );
}
