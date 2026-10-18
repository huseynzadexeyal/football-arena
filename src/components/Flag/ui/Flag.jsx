import styles from "../styles/Flag.module.css";

// Sadə SVG bayraqlar (2:1). Emoji bayraqlar Windows-da hərflə göstərildiyi üçün SVG istifadə olunur.
const FLAGS = {
  Argentina: (
    <>
      <rect width="60" height="30" fill="#75aadb" />
      <rect y="10" width="60" height="10" fill="#fff" />
      <circle cx="30" cy="15" r="3" fill="#f6b40e" />
    </>
  ),
  Portugal: (
    <>
      <rect width="60" height="30" fill="#e42518" />
      <rect width="24" height="30" fill="#046a38" />
      <circle cx="24" cy="15" r="6" fill="#ffd400" />
      <circle cx="24" cy="15" r="3.4" fill="#e42518" />
    </>
  ),
  France: (
    <>
      <rect width="60" height="30" fill="#fff" />
      <rect width="20" height="30" fill="#0055a4" />
      <rect x="40" width="20" height="30" fill="#ef4135" />
    </>
  ),
  Norway: (
    <>
      <rect width="60" height="30" fill="#ba0c2f" />
      <rect x="16" width="10" height="30" fill="#fff" />
      <rect y="10" width="60" height="10" fill="#fff" />
      <rect x="18" width="6" height="30" fill="#00205b" />
      <rect y="12" width="60" height="6" fill="#00205b" />
    </>
  ),
  Brazil: (
    <>
      <rect width="60" height="30" fill="#009b3a" />
      <polygon points="30,3 55,15 30,27 5,15" fill="#fedf00" />
      <circle cx="30" cy="15" r="7" fill="#002776" />
    </>
  ),
  Belgium: (
    <>
      <rect width="60" height="30" fill="#fae042" />
      <rect width="20" height="30" fill="#000" />
      <rect x="40" width="20" height="30" fill="#ed2939" />
    </>
  ),
  England: (
    <>
      <rect width="60" height="30" fill="#fff" />
      <rect x="26" width="8" height="30" fill="#ce1124" />
      <rect y="11" width="60" height="8" fill="#ce1124" />
    </>
  ),
  Croatia: (
    <>
      <rect width="60" height="30" fill="#171796" />
      <rect width="60" height="20" fill="#fff" />
      <rect width="60" height="10" fill="#ff0000" />
      <rect x="25" y="8" width="10" height="12" fill="#fff" stroke="#ff0000" strokeWidth="1" />
      {[0, 1, 2, 3].flatMap((row) =>
        [0, 1].map((col) =>
          (row + col) % 2 === 0 ? (
            <rect key={`${row}-${col}`} x={25.5 + col * 4.5} y={8.5 + row * 2.75} width="4.5" height="2.75" fill="#ff0000" />
          ) : null
        )
      )}
    </>
  ),
  Netherlands: (
    <>
      <rect width="60" height="30" fill="#21468b" />
      <rect width="60" height="20" fill="#fff" />
      <rect width="60" height="10" fill="#ae1c28" />
    </>
  ),
};

export default function Flag({ country, className = "" }) {
  return (
    <svg
      className={`${styles.flag} ${className}`}
      viewBox="0 0 60 30"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={country}
    >
      {FLAGS[country] ?? <rect width="60" height="30" fill="#8b93a1" />}
    </svg>
  );
}
