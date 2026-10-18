import styles from "../styles/PlayerPortrait.module.css";

// Saçın arxa hissəsi (yalnız uzun saç üçün)
function HairBack({ style, color }) {
  if (style !== "long") return null;
  return <path d="M30 40 C26 62 30 78 40 82 L60 82 C70 78 74 62 70 40 Z" fill={color} />;
}

// Saçın ön hissəsi
function HairFront({ style, color }) {
  switch (style) {
    case "short":
      return <path d="M32 40 C30 22 40 15 50 15 C60 15 70 22 68 40 C65 31 58 28 50 28 C42 28 35 31 32 40 Z" fill={color} />;
    case "long":
      return <path d="M32 42 C29 22 40 14 50 14 C60 14 71 22 68 42 C65 30 58 26 50 26 C42 26 35 30 32 42 Z" fill={color} />;
    case "buzz":
      return <path d="M34 37 C34 25 42 21 50 21 C58 21 66 25 66 37 C60 30 40 30 34 37 Z" fill={color} />;
    case "slick":
      return <path d="M32 42 C28 20 48 12 62 18 C70 22 70 32 68 42 C64 28 46 24 32 42 Z" fill={color} />;
    case "bun":
      return (
        <g fill={color}>
          <path d="M32 40 C30 22 40 15 50 15 C60 15 70 22 68 40 C65 31 58 28 50 28 C42 28 35 31 32 40 Z" />
          <circle cx="50" cy="12" r="7" />
        </g>
      );
    case "curly":
      return (
        <g fill={color}>
          {[[36, 31], [44, 24], [56, 24], [64, 31], [50, 21], [33, 40], [67, 40]].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="8" />
          ))}
        </g>
      );
    default:
      return null; // bald
  }
}

// Forma, saç, dəri və nömrəyə görə hər oyunçu üçün öz illüstrasiya portreti
// bare: dairəvi çərçivə və fon olmadan (FIFA kartının şəkil pəncərəsi üçün)
export default function PlayerPortrait({ player, size = "var(--photo, 80px)", bare = false }) {
  const { name, number, skin, hair, hairStyle, beard, kit } = player;

  return (
    <div
      className={bare ? styles.bare : styles.frame}
      style={bare ? undefined : { width: size, height: size }}
      role="img"
      aria-label={name}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <HairBack style={hairStyle} color={hair} />

        {/* forma */}
        <path d="M10 100 C10 78 30 68 50 68 C70 68 90 78 90 100 Z" fill={kit.main} />
        <path d="M39 68 L50 82 L61 68 Z" fill={kit.accent} />
        <text x="50" y="97" textAnchor="middle" fontSize="13" fontWeight="700" fill={kit.accent} fontFamily="Arial, sans-serif">
          {number}
        </text>

        {/* boyun və baş */}
        <rect x="42" y="56" width="16" height="16" rx="4" fill={skin} />
        <ellipse cx="50" cy="66" rx="9" ry="3" fill="#000" opacity="0.12" />
        <circle cx="33" cy="44" r="4" fill={skin} />
        <circle cx="67" cy="44" r="4" fill={skin} />
        <ellipse cx="50" cy="42" rx="17" ry="20" fill={skin} />

        <HairFront style={hairStyle} color={hair} />

        {beard && (
          <path d="M34 46 C34 62 42 65 50 65 C58 65 66 62 66 46 C62 55 58 57 50 57 C42 57 38 55 34 46 Z" fill={hair} />
        )}

        {/* üz */}
        <circle cx="43" cy="42" r="1.8" fill="#222" />
        <circle cx="57" cy="42" r="1.8" fill="#222" />
        <path d="M39 37 L47 36 M53 36 L61 37" stroke={hair} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M50 44 L49 49 L51 49" stroke="#000" strokeOpacity="0.25" fill="none" strokeWidth="1" />
        <path d="M45 53 Q50 56 55 53" stroke="#7a3b2e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
