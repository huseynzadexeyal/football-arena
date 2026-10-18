import { useMemo } from "react";
import styles from "../styles/Confetti.module.css";

const COLORS = ["#ffd24d", "#ff4d4d", "#4aa3ff", "#4cffa0", "#ffffff", "#ff9f43"];

// variant "burst": mərkəzdən partlayış (qol)  |  "rain": yuxarıdan yağış (qələbə)
export default function Confetti({ variant = "burst", count = 40, colors = COLORS }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        color: colors[i % colors.length],
        x: `${(Math.random() * 2 - 1) * 48}vw`,
        y: `${-10 - Math.random() * 38}vh`,
        left: `${Math.random() * 100}%`,
        rot: `${Math.round(Math.random() * 720 - 360)}deg`,
        delay: `${(Math.random() * (variant === "rain" ? 1.6 : 0.15)).toFixed(2)}s`,
        dur: `${(variant === "rain" ? 2.4 + Math.random() * 1.6 : 1.1 + Math.random() * 0.6).toFixed(2)}s`,
      })),
    [count, colors, variant]
  );

  return (
    <div className={`${styles.layer} ${styles[variant]}`} aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={styles.piece}
          style={{
            "--c": p.color, "--x": p.x, "--y": p.y, "--left": p.left,
            "--rot": p.rot, "--delay": p.delay, "--dur": p.dur,
          }}
        />
      ))}
    </div>
  );
}
