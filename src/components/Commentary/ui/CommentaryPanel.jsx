import { useEffect, useRef, useState } from "react";
import { EVENT_ICONS } from "../../../utils/timeline";
import * as sound from "../../../utils/sound";
import styles from "../styles/Commentary.module.css";

const TEAM = { team1: "Team 1", team2: "Team 2" };

// Soldan açılan tam şərh siyahısı (ən yeni hadisə yuxarıda). Matç davam edərkən canlı yenilənir.
export default function CommentaryPanel({ open, feed, onClose }) {
  const [keyOnly, setKeyOnly] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const rows = (keyOnly ? feed.filter((e) => e.big) : feed).slice().reverse();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside
        className={styles.panel}
        lang="en"
        role="dialog"
        aria-modal="true"
        aria-label="Live commentary"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.head}>
          <h2 className={styles.title}>Live commentary</h2>
          <div className={styles.filters} role="group" aria-label="Filter">
            <button
              type="button"
              className={!keyOnly ? styles.on : ""}
              aria-pressed={!keyOnly}
              onClick={() => { sound.click(); setKeyOnly(false); }}
            >
              All
            </button>
            <button
              type="button"
              className={keyOnly ? styles.on : ""}
              aria-pressed={keyOnly}
              onClick={() => { sound.click(); setKeyOnly(true); }}
            >
              Key moments
            </button>
          </div>
          <button type="button" className={styles.close} onClick={onClose} ref={closeRef} aria-label="Close">✕</button>
        </header>

        {rows.length === 0 ? (
          <p className={styles.empty}>Nothing to report yet — commentary starts at kick-off.</p>
        ) : (
          <ol className={styles.list}>
            {rows.map((e) => (
              <li
                key={e.id}
                className={`${styles.row} ${e.big ? styles.big : ""} ${e.side ? styles[e.side] : styles.neutral}`}
              >
                <b className={styles.min}>{e.minute}'</b>
                <span className={styles.icon} aria-hidden="true">{EVENT_ICONS[e.type]}</span>
                <span className={styles.body}>
                  {e.text}
                  {e.side && <i className={styles.tag}>{TEAM[e.side]}</i>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}
