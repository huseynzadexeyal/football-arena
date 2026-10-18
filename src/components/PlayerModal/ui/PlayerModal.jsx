import { useEffect, useRef, useState } from "react";
import { POSITIONS, getCardStats } from "../../../data/players";
import * as sound from "../../../utils/sound";
import PlayerCard from "../../PlayerCard/ui/PlayerCard";
import { CARD_SHAPE } from "../../PlayerCard/ui/CardArt";
import Flag from "../../Flag/ui/Flag";
import styles from "../styles/PlayerModal.module.css";

const STAT_NAMES = {
  pac: "Pace", sho: "Shooting", pas: "Passing", dri: "Dribbling", def: "Defending", phy: "Physical",
  div: "Diving", han: "Handling", kic: "Kicking", ref: "Reflexes", spd: "Speed", pos: "Positioning",
};
const CLOSE_MS = 220;
const RING_R = 26;
const RING_C = 2 * Math.PI * RING_R;

// Kartın qalxan formasında parıltı qatı (mask)
const SHAPE_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 700 1000' preserveAspectRatio='none'><path d='${CARD_SHAPE}'/></svg>`
)}")`;

const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// 0-dan hədəf rəqəmə qədər sayan animasiya
function useCountUp(target, delay = 0, duration = 900) {
  const [value, setValue] = useState(() => (reduceMotion() ? target : 0));
  useEffect(() => {
    if (reduceMotion()) return;
    let raf;
    let start;
    const tick = (t) => {
      start ??= t;
      const k = Math.min(1, (t - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    const timer = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, delay, duration]);
  return value;
}

// Dəyər artdıqca qırmızı → sarı → yaşıl
const statColor = (v) => `hsl(${Math.max(0, Math.min(125, Math.round((v - 30) * 1.9)))}, 85%, 52%)`;

function StatBar({ label, value, index }) {
  const delay = 450 + index * 90;
  const shown = useCountUp(value, delay);
  return (
    <li className={styles.stat} style={{ "--delay": `${delay}ms`, "--c": statColor(value) }}>
      <span className={styles.statTop}>
        <span>{label}</span>
        <b>{shown}</b>
      </span>
      <span className={styles.track}>
        <span className={styles.fill} style={{ width: `${value}%` }} />
      </span>
    </li>
  );
}

function RatingRing({ rating }) {
  const shown = useCountUp(rating, 350, 1000);
  const offset = RING_C * (1 - rating / 99);
  return (
    <div className={styles.ring} aria-label={`Overall ${rating}`}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle className={styles.ringBg} cx="32" cy="32" r={RING_R} />
        <circle
          className={styles.ringFg}
          cx="32"
          cy="32"
          r={RING_R}
          style={{ "--c": RING_C, "--off": offset }}
        />
      </svg>
      <b>{shown}</b>
    </div>
  );
}

function Sheet({ player, goals, isMvp, onClose }) {
  const { name, position, country, number, kit } = player;
  const stats = getCardStats(player);
  const [closing, setClosing] = useState(false);
  const tiltRef = useRef(null);
  const closeRef = useRef(null);

  const close = () => {
    if (closing) return;
    sound.click();
    setClosing(true);
    setTimeout(onClose, CLOSE_MS);
  };
  const closeRefFn = useRef(close);
  closeRefFn.current = close;

  useEffect(() => {
    sound.whoosh();
    if (isMvp) setTimeout(sound.sparkle, 900);
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && closeRefFn.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // yalnız açılanda bir dəfə
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kartı siçan/barmaq istiqamətində 3D əyir, parıltı toxunuş nöqtəsini izləyir
  const onMove = (e) => {
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    el.style.setProperty("--ry", `${(x - 0.5) * 30}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * 30}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--glow", "1");
  };
  const onLeave = () => {
    const el = tiltRef.current;
    if (!el) return;
    ["--rx", "--ry", "--glow"].forEach((v) => el.style.removeProperty(v));
  };

  return (
    <div
      className={`${styles.overlay} ${closing ? styles.closing : ""}`}
      style={{ "--kit": kit.main, "--accent": kit.accent }}
      onClick={close}
    >
      <span className={styles.beam} aria-hidden="true" />

      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={name}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.x} onClick={close} aria-label="Close">✕</button>

        <div className={styles.stage} onPointerMove={onMove} onPointerLeave={onLeave}>
          <span className={styles.bgWrap} aria-hidden="true">
            <span className={styles.bgNumber}>{number}</span>
          </span>
          <div className={styles.flip}>
            <div className={styles.float}>
              <div className={styles.tilt} ref={tiltRef}>
                <div className={styles.cardBox}>
                  <PlayerCard player={player} goals={goals} isMvp={isMvp} />
                </div>
                <span className={styles.shine} style={{ WebkitMaskImage: SHAPE_MASK, maskImage: SHAPE_MASK }} aria-hidden="true" />
              </div>
            </div>
          </div>
          <span className={styles.floor} aria-hidden="true" />
        </div>

        <div className={styles.info}>
          <header className={styles.head}>
            <RatingRing rating={player.rating} />
            <div className={styles.title}>
              <h3 className={styles.name}>{name}</h3>
              <div className={styles.chips}>
                <span className={styles.chip} style={{ "--i": 0 }}>
                  <Flag className={styles.chipFlag} country={country} /> {country}
                </span>
                <span className={`${styles.chip} ${styles[position]}`} style={{ "--i": 1 }}>
                  {POSITIONS[position]}
                </span>
                <span className={styles.chip} style={{ "--i": 2 }}>#{number}</span>
              </div>
            </div>
          </header>

          <ul className={styles.stats}>
            {stats.map(({ key, label, value }, i) => (
              <StatBar key={key} label={STAT_NAMES[key] ?? label} value={value} index={i} />
            ))}
          </ul>

          <div className={styles.match}>
            <span className={styles.matchLabel}>This match</span>
            <span className={styles.goalRow} aria-label={`${goals} goals`}>
              {goals > 0 ? (
                Array.from({ length: goals }, (_, i) => (
                  <span key={i} className={styles.goalBall} style={{ "--i": i }}>⚽</span>
                ))
              ) : (
                <em>No goals yet</em>
              )}
            </span>
            {isMvp && <span className={styles.mvp}>⭐ Man of the match</span>}
          </div>

          <button type="button" className={styles.closeBtn} onClick={close} ref={closeRef}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function PlayerModal({ player, goals = 0, isMvp = false, onClose }) {
  if (!player) return null;
  return <Sheet key={player.id} player={player} goals={goals} isMvp={isMvp} onClose={onClose} />;
}
