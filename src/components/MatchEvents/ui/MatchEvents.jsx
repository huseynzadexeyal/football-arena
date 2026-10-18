import styles from "../styles/MatchEvents.module.css";

const SIDE_NAMES = { team1: "Team 1", team2: "Team 2" };

export default function MatchEvents({ events }) {
  return (
    <ol className={styles.list} aria-label="Goals">
      {events.map((e, i) => (
        <li
          key={`${e.playerId}-${e.minute}-${i}`}
          className={`${styles.item} ${styles[e.side]}`}
          title={SIDE_NAMES[e.side]}
        >
          <span className={styles.minute}>{e.minute}'</span>
          <span aria-hidden="true">⚽</span>
          <span>{e.playerName}</span>
        </li>
      ))}
    </ol>
  );
}
