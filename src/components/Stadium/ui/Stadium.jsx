import styles from "../styles/Stadium.module.css";

// Bütün səhifənin arxasında sabit duran gecə stadionu (yalnız CSS)
// boost = true → start sayımı zamanı projektorlar daha parlaq yanır
export default function Stadium({ boost = false }) {
  return (
    <div className={`${styles.stadium} ${boost ? styles.boost : ""}`} aria-hidden="true">
      <div className={styles.lights} />
      <div className={styles.stands} />
      <div className={styles.boards} />
      <div className={styles.pitch}>
        <div className={styles.half} />
        <div className={styles.circle} />
        <div className={`${styles.box} ${styles.boxLeft}`} />
        <div className={`${styles.box} ${styles.boxRight}`} />
      </div>
      <div className={styles.vignette} />
    </div>
  );
}
