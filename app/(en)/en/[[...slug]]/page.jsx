import Page, {
  allStaticParams,
  generateMetadata as metadata,
} from "../../../../components/page-route";
export const dynamicParams = false;
const englishParams = async (params) => ({
  slug: ["en", ...((await params).slug || [])],
});
export async function generateStaticParams() {
  return (await allStaticParams())
    .filter(({ slug }) => slug[0] === "en")
    .map(({ slug }) => ({ slug: slug.slice(1) }));
}
export async function generateMetadata({ params }) {
  return metadata({ params: englishParams(params) });
}
export default function EnglishPage({ params }) {
  return <Page params={englishParams(params)} />;
}
