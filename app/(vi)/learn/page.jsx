import { getLearning } from "../../../lib/learning.mjs";
import { pageMetadata } from "../../../lib/metadata.mjs";
import { LearningIndex } from "../../../components/learning/learning-index";
export const metadata = pageMetadata({
  title: "Thư viện thực hành · AI Morning",
  description:
    "Bài thực hành cho developer: công việc trong team, hoạt hình 3D, dựng video và làm game.",
  path: "/learn/",
});
export default async function Page() {
  return <LearningIndex articles={(await getLearning()).articles} />;
}
