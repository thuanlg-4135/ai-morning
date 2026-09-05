import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Coffee,
  Sparkles,
  Zap,
  Radio,
  Terminal,
  CircleCheck,
  Clock3,
  Sun,
} from "lucide-react";
import { renderVisual } from "../scripts/visuals.mjs";
import { MorningDesk, CornerGarden } from "./morning-art";
import {
  asset,
  basePath,
  datePath,
  formatDate,
  homePath,
  words,
} from "../lib/site.mjs";
import {
  ArchiveBrowser,
  MemoChecklist,
  Progress,
  ReadingTools,
  Reveal,
  StoryActions,
} from "./reading-tools";

function Header({ language, languageHref, edition, archive = false }) {
  const t = words(language);
  const home = homePath(language);
  const sectionPath = archive ? home : "";
  return (
    <>
      <a className="skip-link" href="#main-content">
        {t.skip}
      </a>
      <header className="masthead shell">
        <div className="utility-row">
          <span className="utility-intro">
            <span className="status-dot" />
            {t.intro}
          </span>
          <div className="utility-controls">
            {languageHref && (
              <Link
                className="language-link"
                href={languageHref}
                hrefLang={language === "vi" ? "en" : "vi"}
              >
                {language === "vi" ? "EN" : "VI"}
                <ArrowUpRight size={11} />
              </Link>
            )}
            <ReadingTools language={language} />
          </div>
        </div>
        <div className="brand-row">
          <div className="brand-side">
            <span className="eyebrow">THE DAILY AI BRIEFING</span>
            <span>
              {language === "vi"
                ? "Dành cho người làm phần mềm."
                : "Made for people who build."}
            </span>
          </div>
          <Link href={home} className="brand" aria-label="AI Morning">
            <Sun className="brand-sun" aria-hidden="true" />
            <span>
              AI<span className="brand-morning">Morning</span>
              <span className="brand-period">.</span>
            </span>
          </Link>
          <div className="brand-side brand-side-right">
            <time dateTime={edition.edition_date}>
              {formatDate(edition.edition_date, language)}
            </time>
            <span>
              {t.edition} {String(edition.edition_number).padStart(3, "0")}{" "}
              <span className="tiny-star">✳</span>{" "}
              {edition.meta?.reading_minutes ?? 5} {t.minutes}
            </span>
          </div>
        </div>
        <div className="nav-row">
          <nav aria-label={language === "vi" ? "Chuyên mục" : "Sections"}>
            <Link href={home} className={!archive ? "nav-active" : ""}>
              <span className="nav-dot" />
              {t.latest}
            </Link>
            {edition.brief.length > 0 && (
              <Link href={`${sectionPath}#brief`}>{t.quick}</Link>
            )}
            {edition.trends.length > 0 && (
              <Link href={`${sectionPath}#trends`}>{t.deep}</Link>
            )}
            {edition.releases.length > 0 && (
              <Link href={`${sectionPath}#releases`}>{t.releases}</Link>
            )}
            <Link href={`${sectionPath}#memo`}>{t.memo}</Link>
            <Link
              className={archive ? "nav-active" : ""}
              href={`${home}archive/`}
            >
              {t.archive}
              <ArrowUpRight size={13} />
            </Link>
          </nav>
          <span className="nav-note">
            <Coffee size={15} />
            {t.tagline}
          </span>
        </div>
      </header>
    </>
  );
}

function Footer({ language }) {
  const t = words(language);
  return (
    <footer className="footer shell">
      <Link className="footer-brand" href={homePath(language)}>
        AI Morning<span>.</span>
      </Link>
      <p>
        {language === "vi"
          ? "Đọc có chọn lọc. Hiểu điều thay đổi. Làm điều có ích."
          : "Read selectively. Understand the change. Build something useful."}
      </p>
      <Link href={`${homePath(language)}archive/`}>
        {t.archive} <ArrowUpRight size={15} />
      </Link>
      <span className="footer-note">
        {language === "vi"
          ? "Kiểm tra nguồn gốc trước khi áp dụng vào công việc."
          : "Check the original sources before applying a claim to your work."}
      </span>
    </footer>
  );
}

function Visual({ visual, hero = false }) {
  if (!visual) return null;
  if ((visual.kind === "image" || visual.kind === "screenshot") && visual.src) {
    return (
      <figure className={`editorial-visual ${hero ? "hero-visual" : ""}`}>
        <div className="image-frame">
          <Image
            src={asset(visual.src)}
            alt={visual.alt || visual.caption || ""}
            width={1536}
            height={1024}
            sizes={
              hero
                ? "(max-width: 760px) 100vw, 50vw"
                : "(max-width: 760px) 100vw, 65vw"
            }
            loading={hero ? "eager" : "lazy"}
            fetchPriority={hero ? "high" : "auto"}
          />
        </div>
        <figcaption>
          {visual.caption}
          {visual.credit && <span>{visual.credit}</span>}
        </figcaption>
      </figure>
    );
  }
  // This renderer escapes all content and owns the SVG markup; no editorial HTML is accepted.
  return (
    <div
      className={hero ? "hero-vector" : "inline-vector"}
      dangerouslySetInnerHTML={{
        __html: renderVisual(visual, {
          hero,
          assetPrefix: `${basePath}/assets/`,
        }),
      }}
    />
  );
}

function Sources({ sources, language }) {
  const t = words(language);
  const labels =
    language === "en"
      ? { official: "Official", research: "Research", reporting: "Reporting" }
      : {
          official: "Nguồn gốc",
          research: "Nghiên cứu",
          reporting: "Đối chiếu",
        };
  return (
    <div className="sources">
      <span className="source-label">{t.sources}</span>
      {sources.map((source) => (
        <a
          key={source.url}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="source-type">{labels[source.type]}</span>
          <span>{source.label}</span>
          <time dateTime={source.published_at}>
            {source.published_at.slice(0, 10)}
          </time>
          <ArrowUpRight size={13} />
        </a>
      ))}
    </div>
  );
}

function Freshness({ value, language }) {
  const t = words(language);
  return (
    <span
      className={`freshness ${value === "NEW_TODAY" ? "freshness-new" : ""}`}
    >
      <span />
      {value === "NEW_TODAY" ? t.new : t.context}
    </span>
  );
}

function SectionHeading({ number, title, note, icon: Icon = Sparkles }) {
  return (
    <div className="section-heading">
      <div>
        <span className="section-number">{number}</span>
        <h2>
          <Icon size={22} strokeWidth={1.6} />
          {title}
        </h2>
      </div>
      {note && <span className="section-note">{note}</span>}
    </div>
  );
}

function MorningStamp({ language }) {
  return (
    <div className="morning-stamp" aria-hidden="true">
      <span>FRESH PERSPECTIVES</span>
      <Coffee size={33} strokeWidth={1.5} />
      <span>{language === "vi" ? "MỖI BUỔI SÁNG" : "EVERY MORNING"}</span>
    </div>
  );
}

export function EditionPage({ edition, editions, language, languageHref }) {
  const t = words(language);
  const current = editions.findIndex(
    (e) => e.edition_date === edition.edition_date,
  );
  const older = editions[current + 1];
  const newer = editions[current - 1];
  const events = [
    ...edition.brief,
    ...edition.trends,
    ...edition.releases,
    ...edition.radar,
  ];
  const sourceCount = new Set(
    events.flatMap((item) => item.sources.map((s) => s.url)),
  ).size;
  const permalink = `${basePath}${datePath(edition.edition_date, language)}`;
  const sections = [
    ...(edition.brief.length
      ? [{ id: "brief", title: t.quick, count: edition.brief.length }]
      : []),
    ...(edition.trends.length
      ? [{ id: "trends", title: t.deep, count: edition.trends.length }]
      : []),
    ...(edition.releases.length
      ? [{ id: "releases", title: t.releases, count: edition.releases.length }]
      : []),
    { id: "memo", title: t.memo, count: null },
    ...(edition.radar.length
      ? [{ id: "radar", title: t.radar, count: edition.radar.length }]
      : []),
  ];
  const strengths =
    language === "en"
      ? {
          EARLY_SIGNAL: "Early signal",
          EMERGING: "Emerging",
          ACCELERATING: "Accelerating",
          ESTABLISHED: "Established",
        }
      : {
          EARLY_SIGNAL: "Tín hiệu sớm",
          EMERGING: "Đang hình thành",
          ACCELERATING: "Đang tăng tốc",
          ESTABLISHED: "Đã định hình",
        };
  return (
    <>
      <Progress />
      <Header {...{ language, languageHref, edition }} />
      <main id="main-content" className="shell">
        <section className="edition-hero" aria-labelledby="edition-title">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span className="label-pill">
                {current === 0
                  ? t.latest
                  : `${t.edition} ${edition.edition_number}`}
              </span>
              <span className="eyebrow">
                {language === "vi"
                  ? "GÓC NHÌN BUỔI SÁNG"
                  : "THE MORNING PERSPECTIVE"}
              </span>
            </div>
            <h1 id="edition-title">{edition.headline}</h1>
            <p className="hero-dek">{edition.dek}</p>
            <div className="hero-bottom">
              <a className="primary-button" href={`#${sections[0].id}`}>
                {t.read}
                <ArrowDown size={17} />
              </a>
              <span className="read-time">
                <Clock3 size={15} />
                {edition.meta?.reading_minutes ?? 5} {t.minutes}
              </span>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-art-meta">
              <span>THE BIG PICTURE</span>
              <span>
                NO. {String(edition.edition_number).padStart(3, "0")} ↗
              </span>
            </div>
            {edition.hero_visual ? (
              <Visual visual={edition.hero_visual} hero />
            ) : (
              <div className="abstract-morning" aria-hidden="true">
                <Sun />
                <span>
                  A new day.
                  <br />A new perspective.
                </span>
              </div>
            )}
            <MorningStamp language={language} />
          </div>
        </section>
        <div className="edition-strip">
          <span className="strip-label">
            <Zap size={17} fill="currentColor" />
            {t.inside}
          </span>
          <div className="strip-links">
            {sections.map((section, i) => (
              <a key={section.id} href={`#${section.id}`}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {section.title}
                {section.count !== null && <b>{section.count}</b>}
              </a>
            ))}
          </div>
          <span className="strip-sources">
            <CircleCheck size={15} />
            {sourceCount} {t.sources.toLowerCase()}
          </span>
        </div>
        {edition.brief.length > 0 && (
          <section id="brief" className="news-section">
            <span id="briefing" className="anchor-alias" />
            <SectionHeading
              number="01"
              title={t.quick}
              icon={Zap}
              note={
                language === "vi"
                  ? "60 GIÂY ĐỂ NẮM BẮT"
                  : "THE 60-SECOND CATCH-UP"
              }
            />
            <Reveal className="brief-grid">
              {edition.brief.map((item, i) => (
                <article
                  className="brief-card"
                  id={item.event_id}
                  key={item.event_id}
                >
                  <div className="brief-top">
                    <Freshness value={item.freshness} language={language} />
                    <span className="brief-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <Sources sources={item.sources} language={language} />
                </article>
              ))}
            </Reveal>
          </section>
        )}
        <MorningDesk />
        <div className="reading-layout">
          <div className="main-column">
            {edition.trends.length > 0 && (
              <section id="trends" className="news-section">
                <SectionHeading
                  number="02"
                  title={t.deep}
                  note={
                    language === "vi"
                      ? "BỐI CẢNH & GÓC NHÌN"
                      : "CONTEXT & PERSPECTIVE"
                  }
                />
                {edition.trends.map((trend, index) => (
                  <Reveal key={trend.event_id}>
                    <article
                      className="analysis-story"
                      id={trend.id || trend.event_id}
                    >
                      <span
                        className="anchor-alias"
                        id={
                          trend.id && trend.id !== trend.event_id
                            ? trend.event_id
                            : `trend-${index + 1}`
                        }
                      />
                      <div className="story-meta">
                        <Freshness
                          value={trend.freshness}
                          language={language}
                        />
                        <span className="strength">
                          {strengths[trend.strength]}
                        </span>
                        <StoryActions
                          id={`${edition.edition_date}:${trend.event_id}`}
                          title={trend.title}
                          href={`${permalink}#${trend.id || trend.event_id}`}
                          language={language}
                        />
                      </div>
                      <h3>{trend.title}</h3>
                      {trend.visual && <Visual visual={trend.visual} />}
                      <div className="story-prose">
                        {trend.paragraphs.map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                        {trend.pullquote && (
                          <blockquote>{trend.pullquote}</blockquote>
                        )}
                        {trend.stat && (
                          <div className="story-stat">
                            <strong>{trend.stat.value}</strong>
                            <span>
                              {trend.stat.label}
                              {trend.stat.context && (
                                <small>{trend.stat.context}</small>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="action-box">
                        <ArrowUpRight size={22} />
                        <div>
                          <span className="eyebrow">{t.action}</span>
                          <p>{trend.action}</p>
                        </div>
                      </div>
                      <Sources sources={trend.sources} language={language} />
                    </article>
                  </Reveal>
                ))}
              </section>
            )}
            {edition.releases.length > 0 && (
              <section id="releases" className="news-section">
                <SectionHeading
                  number="03"
                  title={t.releases}
                  icon={Terminal}
                  note="CHANGELOG"
                />
                {edition.releases.map((release) => (
                  <Reveal key={release.event_id}>
                    <article className="release-card" id={release.event_id}>
                      <span
                        className="anchor-alias"
                        id={`release-${release.event_id}`}
                      />
                      <div className="release-top">
                        <span className="product-name">
                          <Terminal size={18} />
                          {release.product}
                        </span>
                        <span className="release-status">{release.status}</span>
                      </div>
                      <Freshness
                        value={release.freshness}
                        language={language}
                      />
                      <h3>{release.feature}</h3>
                      <p>{release.summary}</p>
                      {release.visual && <Visual visual={release.visual} />}
                      {["what_changed", "who_gets_it", "why_it_matters"].map(
                        (key) =>
                          release[key] && (
                            <p key={key}>
                              <strong>
                                {
                                  {
                                    what_changed:
                                      language === "vi"
                                        ? "Thay đổi"
                                        : "What changed",
                                    who_gets_it:
                                      language === "vi"
                                        ? "Dành cho ai"
                                        : "Availability",
                                    why_it_matters:
                                      language === "vi" ? "Tác động" : "Impact",
                                  }[key]
                                }
                                :{" "}
                              </strong>
                              {release[key]}
                            </p>
                          ),
                      )}
                      <div className="verdict">
                        <span
                          className={`verdict-label verdict-${release.verdict}`}
                        >
                          {
                            (language === "vi"
                              ? {
                                  TRY_NOW: "Nên thử",
                                  WATCH: "Theo dõi",
                                  SKIP_FOR_NOW: "Chưa nên dùng",
                                }
                              : {
                                  TRY_NOW: "Try now",
                                  WATCH: "Watch",
                                  SKIP_FOR_NOW: "Skip for now",
                                })[release.verdict]
                          }
                        </span>
                        <p>{release.verdict_note}</p>
                      </div>
                      <Sources sources={release.sources} language={language} />
                    </article>
                  </Reveal>
                ))}
              </section>
            )}
          </div>
          <aside className="edition-aside">
            <div className="aside-sticky">
              <div className="contents-card">
                <span className="eyebrow">{t.inside}</span>
                <nav aria-label={t.inside}>
                  {sections.map((section, i) => (
                    <a href={`#${section.id}`} key={section.id}>
                      <span>0{i + 1}</span>
                      {section.title}
                      <ArrowDown size={13} />
                    </a>
                  ))}
                </nav>
                <div className="aside-source-note">
                  <CircleCheck size={17} />
                  <p>
                    {language === "vi"
                      ? "Mỗi tin đều có nguồn để bạn đọc và kiểm tra thêm."
                      : "Every story links to its evidence, so you can check the details."}
                  </p>
                </div>
              </div>
              <div className="coffee-card">
                <Coffee size={39} strokeWidth={1.3} />
                <h3>
                  {language === "vi"
                    ? "Cà phê còn nóng."
                    : "Coffee’s still warm."}
                </h3>
                <p>
                  {language === "vi"
                    ? "Tin đáng đọc, không cần đọc hết internet."
                    : "The stories worth reading. Not the whole internet."}
                </p>
                <span className="coffee-squiggle" aria-hidden="true">
                  〰〰〰
                </span>
                <Link href={`${homePath(language)}archive/`}>
                  {t.archive}
                  <ArrowUpRight size={17} />
                </Link>
              </div>
              {edition.one_number && (
                <div className="aside-number">
                  <strong>{edition.one_number.value}</strong>
                  <p>{edition.one_number.label}</p>
                  {edition.one_number.context && (
                    <small>{edition.one_number.context}</small>
                  )}
                </div>
              )}
              {edition.watching?.length > 0 && (
                <div className="watching">
                  <span className="eyebrow">{t.radar}</span>
                  {edition.watching.map((topic) => (
                    <span key={topic}>{topic}</span>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
        <section id="memo" className="memo-section">
          <span id="developer" className="anchor-alias" />
          <Reveal>
            <div className="memo-heading">
              <span className="label-pill">
                <Terminal size={14} /> DEVELOPER MEMO
              </span>
              <span className="memo-doodle" aria-hidden="true">
                ↳
              </span>
              <h2>{edition.developer_memo.title}</h2>
              <p>{edition.developer_memo.direct_answer}</p>
            </div>
            <div className="memo-columns">
              <div>
                <h3>
                  <CircleCheck size={19} />
                  {t.do}
                </h3>
                <MemoChecklist
                  key={edition.edition_date}
                  actions={edition.developer_memo.actions}
                  language={language}
                />
              </div>
              <div className="memo-avoid">
                <h3>{t.avoid}</h3>
                <ul>
                  {edition.developer_memo.avoid.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </section>
        {edition.radar.length > 0 && (
          <section id="radar" className="news-section">
            <SectionHeading number="05" title={t.radar} icon={Radio} />
            <div className="radar-grid">
              {edition.radar.map((item) => (
                <article id={item.event_id} key={item.event_id}>
                  <span className="eyebrow">{item.status}</span>
                  <p>{item.text}</p>
                  <Sources sources={item.sources} language={language} />
                </article>
              ))}
            </div>
          </section>
        )}
        {edition.wildcard && (
          <section className="wildcard" id="wildcard">
            <span className="eyebrow">WILDCARD ✳</span>
            <h2>{edition.wildcard.title}</h2>
            <p>{edition.wildcard.text}</p>
          </section>
        )}
        <section className="takeaway" id="takeaway">
          <CornerGarden />
          <Sun size={39} strokeWidth={1.3} />
          <span className="eyebrow">{t.remember}</span>
          <p>{edition.takeaway}</p>
          <span className="takeaway-rule" />
        </section>
        <div className="edition-end">
          <div>
            <span className="eyebrow">{t.finish}</span>
            <p>{t.finishNote}</p>
          </div>
          <div className="edition-pagination">
            {older && (
              <Link href={datePath(older.edition_date, language)}>
                ← {formatDate(older.edition_date, language)}
              </Link>
            )}
            {newer && (
              <Link href={datePath(newer.edition_date, language)}>
                {formatDate(newer.edition_date, language)} →
              </Link>
            )}
            <Link href={`${homePath(language)}archive/`}>
              {t.archive}
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </main>
      <Footer language={language} />
    </>
  );
}

export function ArchivePage({ edition, summaries, language, languageHref }) {
  const t = words(language);
  return (
    <>
      <Header {...{ language, languageHref, edition }} archive />
      <main id="main-content" className="shell archive-main">
        <div className="archive-hero">
          <div>
            <span className="eyebrow">THE MORNING ARCHIVE</span>
            <h1>{t.past}</h1>
            <p>
              {language === "vi"
                ? "Tìm lại tin đã đọc, khám phá góc nhìn đã bỏ lỡ."
                : "Revisit a story. Discover a perspective you missed."}
            </p>
          </div>
          <div className="archive-count">
            <span>{String(summaries.length).padStart(2, "0")}</span>
            <span className="eyebrow">{t.results}</span>
            <Sun size={32} />
          </div>
        </div>
        <MorningDesk className="archive-desk" />
        <ArchiveBrowser editions={summaries} language={language} />
      </main>
      <Footer language={language} />
    </>
  );
}
