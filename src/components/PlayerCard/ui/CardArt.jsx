import { useId } from "react";
import styles from "../styles/PlayerCard.module.css";

// Kartın forması (700×1000). Ucu çıxıntılı qalxan, qızıl çərçivə, içəridə tünd fon və cızıqlar.
export const CARD_SHAPE =
  "M350 6 C365 26 385 44 410 44 L510 44 C560 44 600 70 625 112 L648 152 L648 820 C648 860 625 892 590 918 L430 972 C400 982 375 990 350 994 C325 990 300 982 270 972 L110 918 C75 892 52 860 52 820 L52 152 L75 112 C100 70 140 44 190 44 L290 44 C315 44 335 26 350 6 Z";

const scaleAroundCenter = (x, y) => `translate(350 500) scale(${x} ${y}) translate(-350 -500)`;

export default function CardArt() {
  const uid = useId().replace(/:/g, "");
  const id = (name) => `${uid}-${name}`;
  const ref = (name) => ({ fill: `url(#${id(name)})` });

  return (
    <svg className={styles.art} viewBox="0 0 700 1000" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id("frame")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--card-frame-1)" }} />
          <stop offset="0.5" style={{ stopColor: "var(--card-frame-2)" }} />
          <stop offset="1" style={{ stopColor: "var(--card-frame-3)" }} />
        </linearGradient>
        <linearGradient id={id("bg")} x1="0.1" y1="0" x2="0.7" y2="1">
          <stop offset="0" style={{ stopColor: "var(--card-bg-1)" }} />
          <stop offset="1" style={{ stopColor: "var(--card-bg-2)" }} />
        </linearGradient>
        <radialGradient id={id("glow")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" style={{ stopColor: "var(--card-glow)", stopOpacity: 0.9 }} />
          <stop offset="1" style={{ stopColor: "var(--card-glow)", stopOpacity: 0 }} />
        </radialGradient>
        <clipPath id={id("clip")}>
          <path d={CARD_SHAPE} transform={scaleAroundCenter(0.952, 0.968)} />
        </clipPath>
      </defs>

      {/* qızıl çərçivə + nazik tünd ara xətt */}
      <path d={CARD_SHAPE} style={ref("frame")} />
      <path d={CARD_SHAPE} transform={scaleAroundCenter(0.975, 0.982)} style={{ fill: "var(--card-gap)" }} />
      <path d={CARD_SHAPE} transform={scaleAroundCenter(0.952, 0.968)} style={ref("bg")} />

      {/* fon bəzəkləri (yalnız daxili forma daxilində) */}
      <g clipPath={`url(#${id("clip")})`}>
        <ellipse cx="520" cy="250" rx="300" ry="270" style={ref("glow")} />
        <path
          d="M52 340 C150 250 260 310 340 220 C420 130 540 170 648 60 L648 -20 L52 -20 Z"
          style={{ fill: "var(--card-wave)" }}
          fillOpacity="0.38"
        />
        <path
          d="M52 520 C170 470 250 520 340 440 C430 360 540 400 648 330 L648 520 Z"
          style={{ fill: "var(--card-wave)" }}
          fillOpacity="0.16"
        />
        <g style={{ fill: "var(--card-streak)" }}>
          <polygon points="110,96 340,38 352,60 122,126" fillOpacity="0.75" />
          <polygon points="70,176 262,124 270,141 80,196" fillOpacity="0.55" />
          <polygon points="300,138 480,92 487,108 311,156" fillOpacity="0.6" />
          <polygon points="150,236 250,208 255,218 158,248" fillOpacity="0.45" />
          <polygon points="420,30 520,60 510,70 410,44" fillOpacity="0.5" />
        </g>
        <path
          d="M52 760 C180 640 330 710 460 690 C560 675 610 640 648 610"
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          style={{ stroke: "var(--card-trim)" }}
          strokeOpacity="0.3"
        />
        <path
          d="M52 830 C200 740 330 800 470 770 C560 750 610 720 648 700"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          style={{ stroke: "var(--card-streak)" }}
          strokeOpacity="0.3"
        />
      </g>

      {/* nazik daxili qızıl xətt */}
      <path
        d={CARD_SHAPE}
        transform={scaleAroundCenter(0.937, 0.956)}
        fill="none"
        strokeWidth="2.5"
        style={{ stroke: "var(--card-trim)" }}
        strokeOpacity="0.8"
      />

      {/* ayırıcı xətlər */}
      <g strokeWidth="2.2" style={{ stroke: "var(--card-line)" }} strokeOpacity="0.9">
        <line x1="145" y1="300" x2="225" y2="300" />
        <line x1="148" y1="638" x2="570" y2="638" />
        <line x1="360" y1="668" x2="360" y2="842" />
        <line x1="308" y1="878" x2="412" y2="878" />
      </g>
    </svg>
  );
}
