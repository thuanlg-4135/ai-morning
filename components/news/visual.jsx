import Image from "next/image";
import { asset } from "../../lib/site.mjs";
import { renderVisual } from "../../scripts/visuals.mjs";
import styles from "./news.module.css";

export function Visual({ visual, thumbnail = false, priority = false }) {
  if (!visual) return null;
  const image =
    (visual.kind === "image" || visual.kind === "screenshot") && visual.src;
  return (
    <figure className={`${styles.visual} ${thumbnail ? styles.thumbnail : ""}`}>
      {image ? (
        <Image
          src={asset(visual.src)}
          alt={thumbnail ? "" : visual.alt || visual.caption || ""}
          width={1536}
          height={1024}
          sizes={
            thumbnail
              ? "(max-width: 600px) 100vw, (max-width: 900px) 50vw, 40vw"
              : "(max-width: 900px) 100vw, 840px"
          }
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
        />
      ) : (
        <div
          className={styles.diagram}
          dangerouslySetInnerHTML={{ __html: renderVisual(visual) }}
        />
      )}
      {!thumbnail && (visual.caption || visual.credit) && (
        <figcaption>
          {visual.caption}
          {visual.credit && <span> · {visual.credit}</span>}
        </figcaption>
      )}
    </figure>
  );
}
