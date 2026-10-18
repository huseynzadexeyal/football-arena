import Clock from "../../Clock/ui/Clock";
import styles from "../styles/Scoreboard.module.css";

// chance: { team1: %, team2: % } — komandaların gücünə görə qalib gəlmə şansı
export default function Scoreboard({ team1, team2, score, chance, minute, phase, tickMs }) {
  const progress = Math.min(1, minute / 90);
  return (
    <div className={styles.board} aria-label={`${team1} ${score.team1}, ${team2} ${score.team2}`}>
      <div className={styles.side}>
        <span className={styles.name}>{team1}</span>
        <span className={styles.chance}>{chance.team1}% win</span>
      </div>
      <div className={styles.center}>
        <span key={`${score.team1}:${score.team2}`} className={styles.score}>
          {score.team1} : {score.team2}
        </span>
        <Clock minute={minute} phase={phase} tickMs={tickMs} />
      </div>
      <div className={styles.side}>
        <span className={styles.name}>{team2}</span>
        <span className={styles.chance}>{chance.team2}% win</span>
      </div>
      <span
        className={styles.progress}
        style={{ "--p": progress, "--tick": `${tickMs}ms` }}
        aria-hidden="true"
      />
    </div>
  );
}
