// Nümunə məlumatlar — rating, forma rəngi və görünüşü istədiyin kimi dəyişə bilərsən.
// Fayl yoxdursa və ya yüklənmirsə, illüstrasiya portreti göstərilir.
// Kart şəkilləri public/players/cards/ qovluğundadır (fonsuz PNG kəsimlər, bax: tools/cutouts.py).
const PHOTO_EXT = "png"; // şəkillərin formatı: png, webp
const photo = (slug) => `/players/cards/${slug}.${PHOTO_EXT}`;

export const PLAYERS = [
  {
    id: 1, name: "Lionel Messi", shortName: "MESSI", role: "RW", position: "FWD", country: "Argentina", rating: 91, number: 10,
    image: photo("messi"), kit: { main: "#75aadb", accent: "#ffffff" },
    skin: "#e8b88f", hair: "#4a2f1e", hairStyle: "short", beard: true,
    stats: { pac: 80, sho: 87, pas: 90, dri: 94, def: 33, phy: 64 },
  },
  {
    id: 2, name: "Cristiano Ronaldo", shortName: "RONALDO", role: "ST", position: "FWD", country: "Portugal", rating: 88, number: 7,
    image: photo("ronaldo"), kit: { main: "#c1121f", accent: "#0a8f4a" },
    skin: "#e5b48a", hair: "#2b1b12", hairStyle: "slick", beard: false,
    stats: { pac: 82, sho: 93, pas: 82, dri: 85, def: 34, phy: 77 },
    photoFit: "contain", // kəsim şəkli kartın şəkil pəncərəsinə sığdırılır
  },
  {
    id: 3, name: "Kylian Mbappé", shortName: "MBAPPÉ", role: "ST", position: "FWD", country: "France", rating: 91, number: 10,
    image: photo("mbappe"), kit: { main: "#1d3b8b", accent: "#ffffff" },
    skin: "#8d5a3b", hair: "#1a1210", hairStyle: "buzz", beard: false,
    stats: { pac: 97, sho: 90, pas: 80, dri: 92, def: 36, phy: 78 },
    photoFit: "contain", // kəsim şəkli kartın şəkil pəncərəsinə sığdırılır
  },
  {
    id: 4, name: "Erling Haaland", shortName: "HAALAND", role: "ST", position: "FWD", country: "Norway", rating: 91, number: 9,
    image: photo("haaland"), kit: { main: "#c8102e", accent: "#ffffff" },
    skin: "#f1c9a5", hair: "#e8c872", hairStyle: "bun", beard: false,
    stats: { pac: 89, sho: 93, pas: 66, dri: 80, def: 45, phy: 88 },
    photoFit: "contain", // kəsim şəkli kartın şəkil pəncərəsinə sığdırılır
  },
  {
    id: 5, name: "Vinícius Júnior", shortName: "VINÍCIUS JR", role: "LW", position: "FWD", country: "Brazil", rating: 90, number: 7,
    image: photo("vinicius"), kit: { main: "#f9d71c", accent: "#0a7a3a" },
    skin: "#6b4228", hair: "#17110d", hairStyle: "curly", beard: false,
    stats: { pac: 95, sho: 83, pas: 80, dri: 92, def: 29, phy: 68 },
  },
  {
    id: 6, name: "Kevin De Bruyne", shortName: "DE BRUYNE", role: "CM", position: "MID", country: "Belgium", rating: 91, number: 17,
    image: photo("de-bruyne"), kit: { main: "#d62828", accent: "#ffd23f" },
    skin: "#f0c7a2", hair: "#c9803a", hairStyle: "short", beard: true,
    stats: { pac: 74, sho: 88, pas: 94, dri: 87, def: 64, phy: 78 },
  },
  {
    id: 7, name: "Jude Bellingham", shortName: "BELLINGHAM", role: "CM", position: "MID", country: "England", rating: 90, number: 5,
    image: photo("bellingham"), kit: { main: "#ffffff", accent: "#c8102e" },
    skin: "#c68d62", hair: "#1a1210", hairStyle: "short", beard: false,
    stats: { pac: 80, sho: 83, pas: 83, dri: 87, def: 78, phy: 82 },
    photoFit: "contain", // kəsim şəkli kartın şəkil pəncərəsinə sığdırılır
  },
  {
    id: 8, name: "Luka Modrić", shortName: "MODRIĆ", role: "CM", position: "MID", country: "Croatia", rating: 86, number: 10,
    image: photo("modric"), kit: { main: "#e63946", accent: "#ffffff" },
    skin: "#ecc19c", hair: "#d9b25f", hairStyle: "long", beard: false,
    stats: { pac: 73, sho: 76, pas: 89, dri: 88, def: 72, phy: 66 },
  },
  {
    id: 9, name: "Virgil van Dijk", shortName: "VAN DIJK", role: "CB", position: "DEF", country: "Netherlands", rating: 89, number: 4,
    image: photo("van-dijk"), kit: { main: "#ff7a00", accent: "#1b1b1b" },
    skin: "#7a4b30", hair: "#16100d", hairStyle: "buzz", beard: true,
    stats: { pac: 77, sho: 60, pas: 71, dri: 72, def: 90, phy: 86 },
  },
  {
    id: 10, name: "Thibaut Courtois", shortName: "COURTOIS", role: "GK", position: "GK", country: "Belgium", rating: 89, number: 1,
    image: photo("courtois"), kit: { main: "#2f2f2f", accent: "#f5c400" },
    skin: "#efc6a0", hair: "#3b2a1c", hairStyle: "short", beard: false,
    stats: { div: 85, han: 87, kic: 78, ref: 90, spe: 49, pos: 88 },
  },
];

export const POSITIONS = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward",
};

// Kartdakı 6 göstərici (FIFA düzümü: əvvəl sol sütun, sonra sağ sütun).
// Qapıçılar üçün ayrı göstəricilər istifadə olunur.
const OUTFIELD_STATS = [["pac", "PAC"], ["sho", "SHO"], ["pas", "PAS"], ["dri", "DRI"], ["def", "DEF"], ["phy", "PHY"]];
const GOALKEEPER_STATS = [["div", "DIV"], ["han", "HAN"], ["kic", "KIC"], ["ref", "REF"], ["spe", "SPD"], ["pos", "POS"]];

export const getCardStats = (player) =>
  (player.position === "GK" ? GOALKEEPER_STATS : OUTFIELD_STATS).map(([key, label]) => ({
    key,
    label,
    value: player.stats[key],
  }));
