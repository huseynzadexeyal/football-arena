import { EVENT_ICONS } from "../../../utils/timeline";
import styles from "../styles/Commentary.module.css";

// Hesabın altında tək sətirlik canlı şərh: ən son hadisə
export default function CommentaryTicker({ item, placeholder }) {
  return (
    <div className={styles.ticker} role="status" aria-live="polite" aria-atomic="true">
      {item ? (
        <p
          key={item.id}
          className={`${styles.line} ${item.big ? styles.big : ""} ${item.side ? styles[item.side] : styles.neutral}`}
        >
          <b className={styles.min}>{item.minute}'</b>
          <span aria-hidden="true">{EVENT_ICONS[item.type]}</span>
          <span className={styles.text}>{item.text}</span>
        </p>
      ) : (
        <p className={styles.idle}>{placeholder}</p>
      )}
    </div>
  );
}
