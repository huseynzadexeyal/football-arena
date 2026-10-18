import { useEffect, useMemo, useRef } from "react";
import { computeStats } from "../../../utils/timeline";
import * as sound from "../../../utils/sound";
import styles from "../styles/MatchStats.module.css";

// [açar, başlıq, "%" ilə göstərilsin?]
const ROWS = [
  ["possession", "Possession", true],
  ["shots", "Shots"],
  ["onTarget", "On target"],
  ["corners", "Corners"],
  ["fouls", "Fouls"],
  ["offsides", "Offsides"],
  ["saves", "Saves"],
  ["passes", "Passes"],
  ["passAcc", "Pass accuracy", true],
  ["yellow", "Yellow cards"],
  ["red", "Red cards"],
];

function StatRow({ label, a, b, percent }) {
  const total = a + b;
  const share = total === 0 ? 50 : (a / total) * 100;
  const lead = a === b ? "" : a > b ? styles.leadA : styles.leadB;
  const fmt = (v) => (percent ? `${v}%` : v);
  return (
    <li className={`${styles.row} ${lead}`}>
      <span className={styles.vA}>{fmt(a)}</span>
      <span className={styles.label}>{label}</span>
      <span className={styles.vB}>{fmt(b)}</span>
      <span className={styles.bar} aria-hidden="true">
        <span className={styles.barA} style={{ width: total === 0 ? "0%" : `${share}%` }} />
        <span className={styles.barB} style={{ width: total === 0 ? "0%" : `${100 - share}%` }} />
      </span>
    </li>
  );
}

// Dəqiqəyə görə qol / kart nişanları olan 0'–90' zolağı (yuxarı Team 1, aşağı Team 2)
function Timeline({ items, minute }) {
  const marks = items.filter((e) => ["goal", "yellow", "red", "post"].includes(e.type) && e.side);
  const icon = { goal: "⚽", yellow: "🟨", red: "🟥", post: "🥅" };
  return (
    <div className={styles.timeline} aria-label="Match timeline">
      <div className={styles.track}>
        <span className={styles.progress} style={{ width: `${Math.min(100, (minute / 90) * 100)}%` }} />
        <span className={styles.half} />
      </div>
      {marks.map((e) => (
        <span
          key={e.id}
          className={`${styles.mark} ${e.side === "team1" ? styles.up : styles.down} ${e.type === "goal" ? styles.goalMark : ""}`}
          style={{ left: `${Math.min(97, Math.max(3, (e.minute / 90) * 100))}%` }}
          title={`${e.minute}' ${e.playerName}`}
        >
          {icon[e.type]}
        </span>
      ))}
      <span className={styles.tick0}>0'</span>
      <span className={styles.tick45}>45'</span>
      <span className={styles.tick90}>90'</span>
    </div>
  );
}

export default function MatchStats({ open, onClose, teams, score, minute, phase, items, meta, mvpId }) {
  const closeRef = useRef(null);
  const { stats, players } = useMemo(() => computeStats(items, meta, minute), [items, meta, minute]);

  useEffect(() => {
    if (!open) return;
    sound.whoosh();
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // yalnız açılanda bir dəfə
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const [first, second] = teams;
  const done = phase === "fulltime" || phase === "finished";
  const status = phase === "dealing" || phase === "ready" || phase === "countdown"
    ? "Pre-match"
    : done ? "Full time" : phase === "halftime" ? "Half time" : `Live · ${minute}'`;

  // matçda iştirak edən oyunçular (qol, assist, xilas, kart) — ən çox töhfə verən yuxarıda
  const roster = teams.flatMap((t, ti) => t.team.map((p) => ({ p, side: ti === 0 ? "team1" : "team2" })));
  const involved = roster
    .map(({ p, side }) => ({ p, side, s: players[p.id] }))
    .filter(({ s }) => s && (s.goals || s.assists || s.saves || s.yellow || s.red))
    .sort((x, y) => (y.s.goals * 3 + y.s.assists * 2 + y.s.saves) - (x.s.goals * 3 + x.s.assists * 2 + x.s.saves));

  return (
    <div className={styles.overlay} onClick={onClose}>
      <section
        className={styles.sheet}
        lang="en"
        role="dialog"
        aria-modal="true"
        aria-label="Match statistics"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.x} onClick={onClose} ref={closeRef} aria-label="Close">✕</button>

        <header className={styles.head}>
          <span className={`${styles.status} ${!done && status.startsWith("Live") ? styles.live : ""}`}>{status}</span>
          <div className={styles.scoreRow}>
            <span className={`${styles.team} ${styles.t1}`}>{first.name}</span>
            <span className={styles.score}>{score.team1} : {score.team2}</span>
            <span className={`${styles.team} ${styles.t2}`}>{second.name}</span>
          </div>
        </header>

        <Timeline items={items} minute={minute} />

        <ul className={styles.rows}>
          {ROWS.map(([key, label, percent]) => (
            <StatRow key={key} label={label} a={stats.team1[key]} b={stats.team2[key]} percent={percent} />
          ))}
        </ul>

        <h3 className={styles.sub}>Key players</h3>
        {involved.length === 0 ? (
          <p className={styles.empty}>No standout moments yet.</p>
        ) : (
          <ul className={styles.players}>
            {involved.map(({ p, side, s }) => (
              <li key={p.id} className={`${styles.player} ${side === "team1" ? styles.p1 : styles.p2}`}>
                <span className={styles.pname}>
                  {p.id === mvpId && done && <span title="Man of the match">⭐ </span>}
                  {p.name}
                </span>
                <span className={styles.chips}>
                  {s.goals > 0 && <i>⚽ {s.goals}</i>}
                  {s.assists > 0 && <i>🅰️ {s.assists}</i>}
                  {s.saves > 0 && <i>🧤 {s.saves}</i>}
                  {s.shots > 0 && <i className={styles.dim}>🎯 {s.shots}</i>}
                  {s.yellow > 0 && <i>🟨</i>}
                  {s.red > 0 && <i>🟥</i>}
                </span>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className={styles.closeBtn} onClick={onClose}>Close</button>
      </section>
    </div>
  );
}
