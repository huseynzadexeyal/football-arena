import { useEffect, useRef, useState } from "react";
import styles from "../styles/Clock.module.css";

const pad = (n) => String(n).padStart(2, "0");

// Matç taymeri: dəqiqə App-dən gəlir, saniyələr dəqiqə daxilində hamar axır (00:00 → 90:00)
export default function Clock({ minute, phase, tickMs }) {
  const [sec, setSec] = useState(0);
  const startRef = useRef(0);
  const live = phase === "live";

  // yeni dəqiqə başlayanda saniyə sıfırlanır
  useEffect(() => {
    startRef.current = performance.now();
    setSec(0);
  }, [minute]);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      setSec(Math.min(59, Math.floor(((performance.now() - startRef.current) / tickMs) * 60)));
    }, 80);
    return () => clearInterval(id);
  }, [live, tickMs]);

  let text = `${pad(minute)}:${pad(live ? sec : 0)}`;
  if (phase === "halftime") text = "HALF TIME";
  else if (phase === "fulltime" || phase === "finished") text = "FULL TIME";

  return (
    <span className={`${styles.clock} ${live ? styles.live : ""}`} role="timer" aria-label={text}>
      <span className={`${styles.ball} ${live ? styles.spin : ""}`} aria-hidden="true">⚽</span>
      {text}
    </span>
  );
}
