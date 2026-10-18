import styles from "../styles/Banner.module.css";

// Ekranın ortasından keçən yayım zolağı: "HALF TIME", "FULL TIME" və s.
export default function Banner({ title, sub, durationMs }) {
  return (
    <div className={styles.banner} style={{ "--dur": `${durationMs}ms` }} role="status" aria-live="polite">
      <span className={styles.title}>{title}</span>
      {sub && <span className={styles.sub}>{sub}</span>}
    </div>
  );
}
