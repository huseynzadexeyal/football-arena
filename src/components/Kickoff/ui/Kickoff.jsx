import { useEffect, useRef, useState } from "react";
import * as sound from "../../../utils/sound";
import styles from "../styles/Kickoff.module.css";

const STEPS = ["3", "2", "1", "GO!"];
const STEP_MS = 800;
const GO_MS = 700;

// Start verəndən sonra: 3 · 2 · 1 · GO! — hər rəqəmdə şok dalğası, GO-da ağ flaş
export default function Kickoff({ onDone }) {
  const [step, setStep] = useState(0);
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  const isGo = step === STEPS.length - 1;

  // 3-2-1: siqnal səsi, GO!: start fiti
  useEffect(() => {
    if (isGo) sound.whistle(1);
    else sound.beep();
  }, [step, isGo]);

  useEffect(() => {
    const id = setTimeout(
      () => (isGo ? doneRef.current() : setStep((s) => s + 1)),
      isGo ? GO_MS : STEP_MS
    );
    return () => clearTimeout(id);
  }, [step, isGo]);

  return (
    <div className={`${styles.overlay} ${isGo ? styles.go : ""}`} role="status" aria-live="assertive">
      <span key={`ring-${step}`} className={styles.ring} aria-hidden="true" />
      <span key={`num-${step}`} className={styles.label}>
        {STEPS[step]}
      </span>
      {isGo && <span className={styles.flash} aria-hidden="true" />}
    </div>
  );
}
