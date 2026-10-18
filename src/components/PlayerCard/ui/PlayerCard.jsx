import { useEffect, useRef, useState } from "react";
import { getCardStats } from "../../../data/players";
import Flag from "../../Flag/ui/Flag";
import PlayerPortrait from "../../PlayerPortrait/ui/PlayerPortrait";
import CardArt from "./CardArt";
import styles from "../styles/PlayerCard.module.css";

// Forma nömrəsinin rəngi: açıq forma rəngində tünd, tünd formada ağ mətn
function readableOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#1b1b1b" : "#ffffff";
}

// Kartın şəkil pəncərəsi: kəsim şəkli; fayl yoxdursa illüstrasiya portreti
function CardPhoto({ player }) {
  const [failed, setFailed] = useState(false);
  const fit = player.photoFit === "contain" ? styles.contain : styles.cover;

  return (
    <div className={`${styles.photo} ${fit}`}>
      {player.image && !failed ? (
        <img src={player.image} alt="" draggable={false} onError={() => setFailed(true)} />
      ) : (
        <div className={styles.portrait}>
          <PlayerPortrait player={player} bare />
        </div>
      )}
    </div>
  );
}

// onSelect verilsə kart kliklənəbilən olur (Enter / Space da işləyir)
// tier: "bronze" | "silver" | "gold" | "special" (kart paketlərindən gələn nəşr; boş = standart mavi kart)
// card: "yellow" | "red" — matçda aldığı kart; qırmızı olan oyunçunun kartı solğunlaşır
export default function PlayerCard({ player, goals = 0, isMvp = false, tier, card, onSelect }) {
  const { name, shortName, role, rating, number, country, kit } = player;
  const stats = getCardStats(player);

  // Qol sayı artanda kart "sevinir" (hoppanır və silkələnir)
  const [scoring, setScoring] = useState(false);
  const prevGoals = useRef(goals);
  useEffect(() => {
    if (goals <= prevGoals.current) {
      prevGoals.current = goals;
      setScoring(false);
      return;
    }
    prevGoals.current = goals;
    setScoring(true);
    const id = setTimeout(() => setScoring(false), 1200);
    return () => clearTimeout(id);
  }, [goals]);

  const interactive = typeof onSelect === "function";

  const interaction = interactive
    ? {
        role: "button",
        tabIndex: 0,
        title: "Read more",
        onClick: () => onSelect(player),
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(player);
          }
        },
      }
    : {};

  return (
    <article
      className={`${styles.card} ${isMvp ? styles.mvp : ""} ${tier ? styles[`tier_${tier}`] : ""} ${card === "red" ? styles.sentOff : ""} ${interactive ? styles.interactive : ""} ${scoring ? styles.scored : ""}`}
      aria-label={`${name}, ${role}, rating ${rating}`}
      {...interaction}
    >
      <CardArt />

      <div className={styles.rating}>{rating}</div>
      <div className={styles.role}>{role}</div>
      <Flag className={styles.flag} country={country} />
      <span className={styles.shirt} style={{ background: kit.main, color: readableOn(kit.main) }}>
        {number}
      </span>

      <CardPhoto player={player} />

      {isMvp && <span className={`${styles.badge} ${styles.mvpBadge}`}>⭐ MVP</span>}
      {card && <span className={`${styles.cardMark} ${card === "red" ? styles.redMark : styles.yellowMark}`} aria-label={`${card} card`} />}
      {goals > 0 && <span className={`${styles.badge} ${styles.goalBadge}`}>⚽ ×{goals}</span>}

      <h3 className={styles.name}>{shortName}</h3>

      <ul className={styles.stats}>
        {stats.map(({ key, label, value }) => (
          <li key={key} className={styles.stat}>
            <b>{value}</b>
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
