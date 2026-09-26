import { LearningArticle } from "../../../../components/learning/learning-article";
import { notFound } from "next/navigation";
import { getLearning } from "../../../../lib/learning.mjs";
import { pageMetadata } from "../../../../lib/metadata.mjs";
export const dynamicParams = false;
export async function generateStaticParams() {
  return (await getLearning()).articles.map((a) => ({ slug: a.slug }));
}
async function articleFor(params) {
  const { slug } = await params;
  const data = await getLearning();
  const article = data.articles.find((a) => a.slug === slug);
  if (!article) notFound();
  return { ...data, article };
}
export async function generateMetadata({ params }) {
  const { article } = await articleFor(params);
  return pageMetadata({
    title: `${article.title} · AI Morning`,
    description: article.summary,
    path: `/learn/${article.slug}/`,
  });
}
export default async function Page({ params }) {
  return <LearningArticle {...await articleFor(params)} />;
}
