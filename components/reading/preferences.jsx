"use client";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor, BookOpen, Type } from "lucide-react";
import { words } from "../../lib/site.mjs";

export function ReadingTools({ language }) {
  const t = words(language);
  const [theme, setTheme] = useState("auto");
  const [reading, setReading] = useState(false);
  const [large, setLarge] = useState(false);
  useEffect(() => {
    const sync = () => {
      setTheme(document.documentElement.dataset.theme || "auto");
      setReading(document.documentElement.dataset.reading === "true");
      setLarge(document.documentElement.dataset.large === "true");
    };
    sync();
    window.addEventListener("ai-morning-preferences", sync);
    return () => window.removeEventListener("ai-morning-preferences", sync);
  }, []);
  function preference(key, value) {
    if (key === "theme" && value === "auto")
      delete document.documentElement.dataset.theme;
    else document.documentElement.dataset[key] = String(value);
    window.dispatchEvent(new Event("ai-morning-preferences"));
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
