import Confetti from "../../Confetti/ui/Confetti";
import styles from "../styles/GoalFlash.module.css";

const TEAM_COLORS = { team1: "#4aa3ff", team2: "#ff9f43" };

// Qol vurulanda: rəngli flaş, top içəri uçur, "GOAL!" yazısı, qolun müəllifi və konfeti
export default function GoalFlash({ goal, teamName }) {
  const color = TEAM_COLORS[goal.side];
  return (
    <div className={styles.root} style={{ "--tc": color }} role="status" aria-live="polite">
      <span className={styles.flash} aria-hidden="true" />
      <span className={styles.ball} aria-hidden="true">⚽</span>
      <div className={styles.text}>
        <span className={styles.goal}>
          {"GOAL!".split("").map((ch, i) => (
            <span key={i} style={{ "--i": i }}>{ch}</span>
          ))}
        </span>
        <span className={styles.who}>
          <b>{goal.minute}'</b> {goal.playerName} <i>· {teamName}</i>
        </span>
      </div>
      <Confetti variant="burst" count={44} />
    </div>
  );
}
