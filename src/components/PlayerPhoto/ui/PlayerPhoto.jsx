import { useState } from "react";
import PlayerPortrait from "../../PlayerPortrait/ui/PlayerPortrait";
import styles from "../styles/PlayerPhoto.module.css";

// size: piksel (rəqəm) və ya CSS dəyəri ("var(--photo)")
// player.image varsa real şəkil, yoxdursa (və ya yüklənməsə) illüstrasiya portreti
export default function PlayerPhoto({ player, size = "var(--photo, 80px)" }) {
  const [failed, setFailed] = useState(false);

  if (player.image && !failed) {
    return (
      <img
        className={styles.photo}
        style={{ width: size, height: size }}
        src={player.image}
        alt={player.name}
        onError={() => setFailed(true)}
      />
    );
  }

  return <PlayerPortrait player={player} size={size} />;
}
