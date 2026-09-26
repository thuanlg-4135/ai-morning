import Link from "next/link";
import { Search } from "lucide-react";
import { datePath, formatDate, homePath } from "../../lib/site.mjs";
import { newsSections, sectionLabel } from "../../lib/stories.mjs";
import { ReadingTools } from "../reading/preferences";
import styles from "./layout.module.css";

export function SiteHeader({
  edition,
  language = "vi",
  languageHref,
  compact = false,
}) {
  const home = homePath(language);
  return (
    <>
      <a className="skip-link" href="#main-content">
        {language === "vi" ? "Bỏ qua điều hướng" : "Skip to content"}
      </a>
      <header className={`${styles.header} ${compact ? styles.compact : ""}`}>
        <div className={styles.utility}>
          <time dateTime={edition.edition_date}>
            {formatDate(edition.edition_date, language)}
          </time>
          <div>
            <Link href={`${home}archive/#search`}>
              <Search size={13} aria-hidden="true" />
              {language === "vi" ? "Tìm kiếm" : "Search"}
            </Link>
            <Link href={`${home}archive/`}>
              {language === "vi" ? "Bản tin cũ" : "Archive"}
            </Link>
            {languageHref && (
              <Link
                href={languageHref}
                hrefLang={language === "vi" ? "en" : "vi"}
              >
                {language === "vi" ? "EN" : "VI"}
              </Link>
            )}
          </div>
        </div>
        <Link href={home} className={styles.brand} aria-label="AI Morning">
          AI MORNING
        </Link>
        <p className={styles.tagline}>
          {language === "vi"
            ? "Bản tin công nghệ cho kỹ sư phần mềm"
            : "A technology newspaper for software engineers"}
        </p>
        <nav
          className={styles.nav}
          aria-label={language === "vi" ? "Chuyên mục" : "Sections"}
        >
          <Link href={home}>{language === "vi" ? "Mới nhất" : "Latest"}</Link>
          {newsSections.map((section) => (
            <Link key={section} href={`${home}#${section}`}>
              {sectionLabel(section, language)}
            </Link>
          ))}
          <Link href={datePath(edition.edition_date, language)}>
            {language === "vi" ? "Đọc số báo" : "Full edition"}
          </Link>
          {language === "vi" && <Link href="/learn/">Thư viện</Link>}
        </nav>
      </header>
    </>
  );
}

export function SiteFooter({ language = "vi" }) {
  const vi = language === "vi";
  return (
    <footer className={styles.footer}>
      <div>
        <Link className={styles.footerBrand} href={homePath(language)}>
          AI MORNING
        </Link>
        <p>
          {vi
            ? "Tin công nghệ có nguồn, qua góc nhìn của người làm phần mềm."
            : "Technology news with sources and a developer’s perspective."}
        </p>
      </div>
      <div>
        <h2>{vi ? "Về tờ báo" : "About"}</h2>
        <Link href="/about/">
          {vi
            ? "Giới thiệu & nguyên tắc biên tập"
            : "About & editorial policy (VI)"}
        </Link>
        <Link href="/about/#contact">{vi ? "Góp ý" : "Contact (VI)"}</Link>
      </div>
      <div>
        <h2>{vi ? "Khám phá" : "Explore"}</h2>
        <Link href={`${homePath(language)}archive/`}>
          {vi ? "Tất cả số báo" : "All editions"}
        </Link>
        {vi && <Link href="/learn/">Thư viện thực hành</Link>}
      </div>
      <div>
        <h2>{vi ? "Tùy chọn đọc" : "Reading preferences"}</h2>
        <ReadingTools language={language} />
        <Link href="/about/#privacy">
          {vi ? "Dữ liệu trên thiết bị" : "Local data (VI)"}
        </Link>
      </div>
    </footer>
  );
}
