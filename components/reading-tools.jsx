"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll } from "motion/react";
import {
  Bookmark,
  Check,
  Copy,
  Sun,
  Moon,
  Monitor,
  BookOpen,
  Type,
  Search,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { datePath, formatDate, words } from "../lib/site.mjs";

export function ReadingTools({ language }) {
  const t = words(language);
  const [theme, setTheme] = useState("auto");
  const [reading, setReading] = useState(false);
  const [large, setLarge] = useState(false);
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "auto");
    setReading(document.documentElement.dataset.reading === "true");
    setLarge(document.documentElement.dataset.large === "true");
  }, []);
  function preference(key, value) {
    if (key === "theme" && value === "auto")
      delete document.documentElement.dataset.theme;
    else document.documentElement.dataset[key] = String(value);
    try {
      localStorage.setItem(`ai-morning-${key}`, String(value));
    } catch {
      /* Preferences still work for this visit. */
    }
  }
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <div className="reading-tools">
      <button
        className="icon-button focus-toggle"
        aria-label={t.focus}
        title={t.focus}
        aria-pressed={reading}
        onClick={() => {
          setReading(!reading);
          preference("reading", !reading);
        }}
      >
        <BookOpen size={17} />
      </button>
      <button
        className="icon-button"
        aria-label={t.type}
        title={t.type}
        aria-pressed={large}
        onClick={() => {
          setLarge(!large);
          preference("large", !large);
        }}
      >
        <Type size={17} />
      </button>
      <button
        className="theme-button"
        aria-label={`${t.theme}: ${t[theme]}`}
        title={`${t.theme}: ${t[theme]}`}
        onClick={() => {
          const next = { auto: "light", light: "dark", dark: "auto" }[theme];
          setTheme(next);
          preference("theme", next);
        }}
      >
        <Icon size={16} />
        <span>{t[theme]}</span>
      </button>
    </div>
  );
}

export function Progress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      aria-hidden="true"
      className="reading-progress"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

export function Reveal({ children, className = "" }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce || !ref.current) return;
    const element = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.animate(
            [{ transform: "translateY(18px)" }, { transform: "translateY(0)" }],
            { duration: 500, easing: "cubic-bezier(.2,.7,.2,1)" },
          );
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [reduce]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

const savedKey = "ai-morning-saved-stories-v2";
function readSaved() {
  try {
    const value = JSON.parse(localStorage.getItem(savedKey) || "[]");
    return Array.isArray(value)
      ? value.filter(
          (item) =>
            typeof item.id === "string" &&
            typeof item.href === "string" &&
            item.href.startsWith("/") &&
            !item.href.startsWith("//") &&
            typeof item.title === "string",
        )
      : [];
  } catch {
    return [];
  }
}

export function StoryActions({ id, title, href, language }) {
  const t = words(language);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const sync = () => setSaved(readSaved().some((story) => story.id === id));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("saved-stories", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("saved-stories", sync);
    };
  }, [id]);
  function toggle() {
    const stories = readSaved().filter((story) => story.id !== id);
    if (!saved) stories.unshift({ id, title, href });
    try {
      localStorage.setItem(savedKey, JSON.stringify(stories));
      setSaved(!saved);
      window.dispatchEvent(new Event("saved-stories"));
    } catch {
      setMessage(
        language === "en"
          ? "Browser storage is unavailable."
          : "Trình duyệt chưa cho phép lưu bài.",
      );
    }
  }
  return (
    <div className="story-actions">
      <button
        className="icon-button"
        onClick={toggle}
        aria-pressed={saved}
        aria-label={`${saved ? t.unsave : t.save}: ${title}`}
        title={saved ? t.unsave : t.save}
      >
        <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
      </button>
      <button
        className="icon-button"
        aria-label={`${t.copy}: ${title}`}
        title={t.copy}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(
              new URL(href, window.location.origin).href,
            );
            setMessage(t.copied);
          } catch {
            setMessage(t.copyError);
          }
        }}
      >
        <Copy size={16} />
      </button>
      <span className="action-message" role="status">
        {message}
      </span>
    </div>
  );
}

export function ArchiveBrowser({ editions, language }) {
  const t = words(language);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [saved, setSaved] = useState([]);
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
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .toLowerCase();
  const matches = (value) => normalize(value).includes(normalize(query));
  const filtered = editions.filter((e) =>
    matches(`${e.date} ${e.title} ${e.dek} ${e.topics.join(" ")}`),
  );
  const filteredSaved = saved.filter((s) => matches(s.title));
  return (
    <div className="archive-browser">
      <div className="archive-controls">
        <div className="filter-tabs">
          <button aria-pressed={tab === "all"} onClick={() => setTab("all")}>
            {t.all} <span>{editions.length}</span>
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
          <span className="sr-only">{t.search}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
          />
        </label>
      </div>
      <p className="result-count" role="status">
        {tab === "all"
          ? `${filtered.length} ${t.results}`
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
      {(tab === "all" ? !filtered.length : !filteredSaved.length) && (
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

export function MemoChecklist({ actions, language }) {
  const [checked, setChecked] = useState([]);
  return (
    <ul className="memo-checklist">
      {actions.map((action, index) => (
        <li key={action}>
          <label>
            <input
              type="checkbox"
              checked={checked.includes(index)}
              onChange={() =>
                setChecked((previous) =>
                  previous.includes(index)
                    ? previous.filter((i) => i !== index)
                    : [...previous, index],
                )
              }
            />
            <span className="check-box" aria-hidden="true">
              {checked.includes(index) && <Check size={14} />}
            </span>
            <span>{action}</span>
          </label>
        </li>
      ))}
      <li className="checklist-count" aria-live="polite">
        {checked.length}/{actions.length}{" "}
        {language === "en"
          ? "completed this visit"
          : "việc đã làm trong phiên đọc này"}
      </li>
    </ul>
  );
}
