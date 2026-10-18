import { PLAYERS } from "../data/players";

// Kart paketi: 3 kart. Hər kart təsadüfi oyunçu + nəşr (tier) — nəşr kartın rəngini və nadirliyini təyin edir.
export const PACK_SIZE = 3;

export const TIERS = [
  { id: "bronze", label: "Bronze", weight: 46 },
  { id: "silver", label: "Silver", weight: 30 },
  { id: "gold", label: "Gold", weight: 18 },
  { id: "special", label: "Team of the Year", weight: 6 },
];
export const tierRank = (id) => TIERS.findIndex((t) => t.id === id);
export const tierLabel = (id) => TIERS[tierRank(id)]?.label ?? id;

export const COLLECTION_TOTAL = PLAYERS.length * TIERS.length;
const KEY = "football-arena-collection";

export function loadCollection() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

function saveCollection(collection) {
  try {
    localStorage.setItem(KEY, JSON.stringify(collection));
  } catch {
    /* localStorage əlçatmazdırsa, kolleksiya yalnız bu sessiya üçün qalır */
  }
}

export const collectionSize = (collection) => Object.keys(collection).length;

// luck (0..1.5): matçda çox qol olubsa, nadir kart şansı artır
function rollTier(luck) {
  const weights = TIERS.map((t, i) => t.weight * (1 + luck * i * 0.35));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < TIERS.length; i++) {
    r -= weights[i];
    if (r < 0) return TIERS[i].id;
  }
  return TIERS[0].id;
}

// Paketi çəkir, kolleksiyaya yazır. Kartlar nadirliyə görə artan sırada gəlir (ən yaxşısı sonda açılsın).
export function openPack({ luck = 0 } = {}) {
  const collection = loadCollection();
  const picked = [...PLAYERS].sort(() => Math.random() - 0.5).slice(0, PACK_SIZE);
  let cards = picked.map((player) => ({ player, tier: rollTier(luck) }));

  // zəmanət: ən azı bir gümüş və ya daha yaxşı
  if (cards.every((c) => c.tier === "bronze")) {
    cards[Math.floor(Math.random() * cards.length)].tier = "silver";
  }
  cards.sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || a.player.rating - b.player.rating);

  cards = cards.map((c) => {
    const key = `${c.player.id}:${c.tier}`;
    const isNew = !collection[key];
    collection[key] = (collection[key] ?? 0) + 1;
    return { ...c, isNew };
  });
  saveCollection(collection);
  return { cards, owned: collectionSize(collection) };
}
