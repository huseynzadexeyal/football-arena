import PlayerCard from "../../PlayerCard/ui/PlayerCard";
import { DEAL_MS, DEAL_STAGGER_MS } from "../../../utils/deal";
import styles from "../styles/TeamSection.module.css";

const TITLES = { winner: "Winner", lose: "Lose" };

// side: "top" | "bottom" — kartlar ekranın ortasındakı dəstədən öz yerinə uçur
// revealed: oyun bitməyincə Winner/Lose yazılmır
// round: yeni oyunda paylama animasiyası yenidən başlasın deyə
export default function TeamSection({
  name,
  team,
  total,
  result,
  goals,
  cards = {},
  mvpId,
  revealed,
  round,
  side,
  onMore,
}) {
  const order = side === "top" ? 0 : 1; // üst və alt komandaya növbə ilə paylanır

  return (
    <section className={`${styles.team} ${styles[side]}`}>
      <header className={styles.header}>
        <h2 className={`${styles.title} ${revealed ? `${styles[result]} ${styles.reveal}` : ""}`}>
          {revealed ? `${name}: ${TITLES[result]}` : name}
        </h2>
        <p className={styles.total}>{total}</p>
      </header>

      <div className={styles.grid}>
        {team.map((player, i) => (
          <div
            key={`${round}-${player.id}`}
            className={styles.cell}
            style={{
              "--deal-delay": `${(i * 2 + order) * DEAL_STAGGER_MS}ms`,
              "--deal-ms": `${DEAL_MS}ms`,
              "--i": i, // CSS bu indekslə uçuş məsafəsini ekran ölçüsünə görə hesablayır
              "--col": i % 3,
              "--rot": `${(i - 2) * 10}deg`,
            }}
          >
            <PlayerCard
              player={player}
              goals={goals[player.id] ?? 0}
              card={cards[player.id]}
              isMvp={player.id === mvpId}
              onSelect={onMore}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
