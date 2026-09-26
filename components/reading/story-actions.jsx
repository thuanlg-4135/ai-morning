"use client";
import { useEffect, useState } from "react";
import { Bookmark, Copy } from "lucide-react";
import { words } from "../../lib/site.mjs";
import { savedKey, readSaved } from "../../lib/saved-stories.mjs";

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
