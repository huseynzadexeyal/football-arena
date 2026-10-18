import { useEffect, useRef, useState } from "react";
import { COLLECTION_TOTAL, tierLabel, tierRank } from "../../../utils/packs";
import * as sound from "../../../utils/sound";
import Confetti from "../../Confetti/ui/Confetti";
import PlayerCard from "../../PlayerCard/ui/PlayerCard";
import styles from "../styles/PackOpening.module.css";

// Mərhələlər: sealed (bağlı paket) → tearing (silkələnir və cırılır) → reveal (kartlar) 
const TEAR_AT = 750; // cırılma səsi və yuxarı hissənin uçması
const BURST_AT = 1000; // işıq partlayışı
const REVEAL_AT = 1700; // kartların səhnəsinə keçid

const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// pack: [{ player, tier, isNew }] — artan nadirlik sırası ilə; owned: kolleksiyadakı unikal kart sayı
export default function PackOpening({ pack, owned, onClose }) {
  const [stage, setStage] = useState("sealed");
  const [flipped, setFlipped] = useState(() => pack.map(() => false));
  const [burstTier, setBurstTier] = useState(null); // konfeti yalnız qızıl / xüsusi kartlarda
  const timers = useRef([]);
  const startRef = useRef(null);
  const closeRef = useRef(null);

  const allFlipped = flipped.every(Boolean);
  const bestTier = pack.reduce((best, c) => (tierRank(c.tier) > tierRank(best) ? c.tier : best), "bronze");
  const newCount = pack.filter((c) => c.isNew).length;

  useEffect(() => {
    startRef.current?.focus();
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tearOpen = () => {
    if (stage !== "sealed") return;
    sound.click();
    setStage("tearing");
    const k = reduceMotion() ? 0.3 : 1;
    timers.current.push(
      setTimeout(sound.packTear, TEAR_AT * k),
      setTimeout(() => sound.packBurst(tierRank(bestTier)), BURST_AT * k),
      setTimeout(() => setStage("reveal"), REVEAL_AT * k)
    );
  };

  const flip = (i) => {
    if (flipped[i]) return;
    const tier = pack[i].tier;
    sound.reveal(tierRank(tier));
    setFlipped((f) => f.map((v, idx) => (idx === i ? true : v)));
    if (tierRank(tier) >= 2) setBurstTier(`${tier}-${i}`);
  };

  const flipAll = () => {
    pack.forEach((_, i) => setTimeout(() => flip(i), i * 380));
  };

  return (
    <div className={styles.overlay} lang="en" role="dialog" aria-modal="true" aria-label="Card pack opening">
      <button type="button" className={styles.x} onClick={onClose} ref={closeRef} aria-label="Close">✕</button>

      {stage !== "reveal" && (
        <div className={styles.stagePack}>
          <h2 className={styles.heading}>Player Pack</h2>
          <div className={`${styles.packWrap} ${stage === "tearing" ? styles.tearing : ""}`}>
            <span className={styles.glow} aria-hidden="true" />
            <button type="button" className={styles.pack} onClick={tearOpen} ref={startRef} aria-label="Open the pack" disabled={stage !== "sealed"}>
              <span className={styles.top} aria-hidden="true" />
              <span className={styles.body}>
                <span className={styles.crest} aria-hidden="true">⚽</span>
                <span className={styles.brand}>Football Arena</span>
                <span className={styles.kind}>PLAYER PACK</span>
                <span className={styles.count}>{pack.length} CARDS</span>
              </span>
              <span className={styles.bottom} aria-hidden="true" />
              <span className={styles.shine} aria-hidden="true" />
            </button>
            <span className={styles.burst} aria-hidden="true" />
          </div>
          <p className={styles.hint}>{stage === "sealed" ? "Tap the pack to open it" : "Opening…"}</p>
        </div>
      )}

      {stage === "reveal" && (
        <div className={styles.stageCards}>
          <span className={`${styles.rays} ${styles[`rays_${bestTier}`]}`} aria-hidden="true" />
          <h2 className={styles.heading}>{allFlipped ? "Pack opened!" : "Tap a card to reveal it"}</h2>

          <ul className={styles.slots}>
            {pack.map((c, i) => {
              const shown = flipped[i];
              return (
                <li key={c.player.id} className={styles.slotItem} style={{ "--i": i }}>
                  <button
                    type="button"
                    className={`${styles.slot} ${styles[`t_${c.tier}`]} ${shown ? styles.flipped : ""}`}
                    onClick={() => flip(i)}
                    aria-label={shown ? `${c.player.name}, ${tierLabel(c.tier)}` : `Reveal card ${i + 1}`}
                    aria-pressed={shown}
                  >
                    <span className={styles.aura} aria-hidden="true" />
                    <span className={styles.inner}>
                      <span className={`${styles.face} ${styles.back}`} aria-hidden="true">
                        <span className={styles.backCircle} />
                        <span className={styles.backText}>?</span>
                      </span>
                      <span className={`${styles.face} ${styles.front}`}>
                        <span className={styles.cardBox}>
                          <PlayerCard player={c.player} tier={c.tier} />
                        </span>
                      </span>
                    </span>
                  </button>
                  <span className={`${styles.info} ${shown ? styles.infoOn : ""}`} aria-hidden={!shown}>
                    <b className={`${styles.tierChip} ${styles[`t_${c.tier}`]}`}>{tierLabel(c.tier)}</b>
                    <span className={c.isNew ? styles.isNew : styles.dupe}>{c.isNew ? "NEW!" : "Duplicate"}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          {burstTier && <Confetti key={burstTier} variant="burst" count={50} colors={["#ffd24d", "#ffffff", "#4aa3ff", "#ff9f43"]} />}

          <div className={styles.actions}>
            {allFlipped ? (
              <>
                <p className={styles.summary}>
                  {newCount > 0 ? `${newCount} new card${newCount > 1 ? "s" : ""} · ` : "No new cards · "}
                  Collection {owned}/{COLLECTION_TOTAL}
                </p>
                <button type="button" className={styles.btn} onClick={() => { sound.click(); onClose(); }}>Done</button>
              </>
            ) : (
              <button type="button" className={`${styles.btn} ${styles.ghost}`} onClick={() => { sound.click(); flipAll(); }}>
                Reveal all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
