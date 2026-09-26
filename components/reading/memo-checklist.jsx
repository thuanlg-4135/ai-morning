"use client";
import { useState } from "react";
import { Check } from "lucide-react";

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
