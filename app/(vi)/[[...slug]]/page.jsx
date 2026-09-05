import Page, {
  allStaticParams,
  generateMetadata,
} from "../../../components/page-route";
export { generateMetadata };
export const dynamicParams = false;
export async function generateStaticParams() {
  return (await allStaticParams()).filter(({ slug }) => slug[0] !== "en");
}
export default Page;
