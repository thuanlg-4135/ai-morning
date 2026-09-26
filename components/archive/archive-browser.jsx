"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Search, ArrowUpRight, BookOpen } from "lucide-react";
import { datePath, formatDate, words } from "../../lib/site.mjs";
import { readSaved } from "../../lib/saved-stories.mjs";
import "./archive.css";

export function ArchiveBrowser({ editions, stories = [], language }) {
  const t = words(language);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [saved, setSaved] = useState([]);
  const [section, setSection] = useState("all");
  const sectionLabels = {
    brief: t.quick,
    trends: t.deep,
    releases: t.releases,
    radar: t.radar,
  };
  useEffect(() => {
    const sync = () => setSaved(readSaved());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("saved-stories", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("saved-stories", sync);
    };
  }, []);
  const normalize = (value) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .toLowerCase();
  const matches = (value) => normalize(value).includes(normalize(query.trim()));
  const filtered = editions.filter((e) =>
    matches(`${e.date} ${e.title} ${e.dek} ${e.topics.join(" ")}`),
  );
  const filteredSaved = saved.filter((s) => matches(s.title));
  const filteredStories = stories.filter(
    (story) =>
      (section === "all" || story.section === section) &&
      matches(`${story.date} ${story.title} ${story.searchText}`),
  );
  const searchLabel =
    tab === "stories"
      ? language === "vi"
        ? "Tìm trong nội dung bài…"
        : "Search story content…"
      : t.search;
  return (
    <div className="archive-browser">
      <div className="archive-controls">
        <div className="filter-tabs">
          <button aria-pressed={tab === "all"} onClick={() => setTab("all")}>
            {t.all} <span>{editions.length}</span>
          </button>
          <button
            aria-pressed={tab === "stories"}
            onClick={() => setTab("stories")}
          >
            {language === "vi" ? "Từng bài" : "Stories"}{" "}
            <span>{stories.length}</span>
          </button>
          <button
            aria-pressed={tab === "saved"}
            onClick={() => setTab("saved")}
          >
            <Bookmark size={15} />
            {t.saved} <span>{saved.length}</span>
          </button>
        </div>
        <label className="search-field">
          <Search size={18} />
          <span className="sr-only">{searchLabel}</span>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchLabel}
          />
        </label>
      </div>
      {tab === "stories" && (
        <label className="story-section-filter">
          {language === "vi" ? "Chuyên mục" : "Section"}
          <select
            value={section}
            onChange={(event) => setSection(event.target.value)}
          >
            <option value="all">
              {language === "vi" ? "Mọi chuyên mục" : "All sections"}
            </option>
            {Object.entries(sectionLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="result-count" role="status">
        {tab === "all"
          ? `${filtered.length} ${t.results}`
          : tab === "stories"
            ? `${filteredStories.length} ${language === "vi" ? "bài viết" : "stories"}`
            : `${filteredSaved.length} ${t.saved.toLowerCase()}`}
      </p>
      {tab === "all" ? (
        <div className="archive-grid">
          {filtered.map((e) => (
            <Link
              key={e.date}
              className="archive-card"
              href={datePath(e.date, language)}
            >
              <div className="archive-card-top">
                <span className="eyebrow">
                  {t.edition} {String(e.number).padStart(3, "0")}
                </span>
                <ArrowUpRight size={21} />
              </div>
              <time dateTime={e.date}>{formatDate(e.date, language)}</time>
              <h2>{e.title}</h2>
              <p>{e.dek}</p>
              <span className="card-bottom">
                {e.minutes} {t.minutes} <span>AI MORNING ↗</span>
              </span>
            </Link>
          ))}
        </div>
      ) : tab === "stories" ? (
        <div className="story-results">
          {filteredStories.map((story) => (
            <Link
              className="story-result"
              href={
                story.href || `${datePath(story.date, language)}#${story.id}`
              }
              key={`${story.date}:${story.id}`}
            >
              <div className="story-result-meta">
                <span>{sectionLabels[story.section]}</span>
                <time dateTime={story.date}>
                  {formatDate(story.date, language)}
                </time>
              </div>
              <h2>
                {story.title}
                <ArrowUpRight size={19} aria-hidden="true" />
              </h2>
              <p>{story.excerpt}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="saved-list">
          {filteredSaved.map((story) => (
            <a key={story.id} href={story.href}>
              <Bookmark size={20} />
              <h2>{story.title}</h2>
              <ArrowUpRight size={22} />
            </a>
          ))}
        </div>
      )}
      {(tab === "all"
        ? !filtered.length
        : tab === "stories"
          ? !filteredStories.length
          : !filteredSaved.length) && (
        <div className="empty-state">
          <BookOpen size={36} />
          <p>
            {tab === "saved" && !query
              ? language === "en"
                ? "Use the bookmark beside a story to keep it here."
                : "Bấm biểu tượng lưu bên cạnh bài viết để đọc lại tại đây."
              : t.empty}
          </p>
          {query && (
            <button className="text-link" onClick={() => setQuery("")}>
              {language === "en" ? "Clear search" : "Xóa tìm kiếm"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
