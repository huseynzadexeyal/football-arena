import styles from "../styles/EventToast.module.css";

const LABEL = { yellow: "YELLOW CARD", red: "RED CARD", post: "OFF THE POST!" };
const TEAM = { team1: "Team 1", team2: "Team 2" };

// Qoldan başqa vacib anlar üçün qısa bildiriş: sarı / qırmızı kart, dirək
export default function EventToast({ event }) {
  if (!event || !LABEL[event.type]) return null;
  const isCard = event.type === "yellow" || event.type === "red";
  return (
    <div className={`${styles.toast} ${styles[event.type]}`} lang="en" role="status" aria-live="polite">
      {isCard ? <span className={styles.card} aria-hidden="true" /> : <span className={styles.post} aria-hidden="true">🥅</span>}
      <span className={styles.text}>
        <b>{LABEL[event.type]}</b>
        <span>
          {event.minute}' {event.playerName} · {TEAM[event.side]}
        </span>
      </span>
    </div>
  );
}
