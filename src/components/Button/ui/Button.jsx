import styles from "../styles/Button.module.css";

// variant: "danger" (qırmızı) | "success" (yaşıl) | "gold" (qızıl, diqqət çəkən)
// size: "md" | "sm" (kiçik, kartlar üçün)
export default function Button({ children, onClick, variant = "danger", size = "md", disabled = false }) {
  return (
    <button className={`${styles.btn} ${styles[variant]} ${styles[size]}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
