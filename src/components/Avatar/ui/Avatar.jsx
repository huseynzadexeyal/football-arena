import styles from "../styles/Avatar.module.css";

const getInitials = (name) =>
  name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// position: "GK" | "DEF" | "MID" | "FWD" — rəngi müəyyən edir
export default function Avatar({ name, position, size = 110 }) {
  return (
    <div
      className={`${styles.avatar} ${styles[position]}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      role="img"
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
