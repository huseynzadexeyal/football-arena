import { PLAYERS } from "../data/players";
import { buildTimeline } from "./timeline";

const TEAM_SIZE = 5;

// Qol vurma ehtimalı mövqeyə görə (qapıçı vura bilməz)
const SCORER_WEIGHT = { FWD: 5, MID: 3, DEF: 1, GK: 0 };

// ---- Qalib şansı: komandanın gücünə görə ----
// Messi (id 1) və Ronaldo (id 2) komandaya əlavə güc verir; ikisi bir yerdə olsa əlavə "sinerji" bonusu da var
const STAR_IDS = [1, 2];
const STAR_BONUS = 6; // hər ulduz üçün
const STAR_PAIR_BONUS = 4; // ikisi eyni komandada olanda əlavə
const STRENGTH_SCALE = 8; // kiçildikcə güc fərqi nəticəyə daha çox təsir edir
const MIN_CHANCE = 0.1;
const MAX_CHANCE = 0.9;

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

// Komandanın ümumi rating-i (yalnız göstərmək üçün)
export const totalRating = (team) => team.reduce((sum, p) => sum + p.rating, 0);

// Komandanın "döyüş gücü" = ümumi rating + ulduz bonusları
export function teamPower(team) {
  const stars = team.filter((p) => STAR_IDS.includes(p.id)).length;
  const pair = stars === STAR_IDS.length ? STAR_PAIR_BONUS : 0;
  return totalRating(team) + stars * STAR_BONUS + pair;
}

// Team 1-in qalib gəlmə ehtimalı (0..1): güc fərqinə görə logistik əyri
export function winProbability(team1, team2) {
  const diff = teamPower(team1) - teamPower(team2);
  const p = 1 / (1 + Math.exp(-diff / STRENGTH_SCALE));
  return Math.min(MAX_CHANCE, Math.max(MIN_CHANCE, p));
}

// Fisher–Yates qarışdırma (tam bərabər ehtimallı)
function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Mövqe çəkisinə görə qol vuran oyunçunu seç
function pickScorer(team) {
  const weight = (p) => SCORER_WEIGHT[p.position] * Math.pow(p.rating / 90, 3) * (STAR_IDS.includes(p.id) ? 1.25 : 1);
  const total = team.reduce((sum, p) => sum + weight(p), 0);
  let r = Math.random() * total;
  for (const player of team) {
    r -= weight(player);
    if (r < 0) return player;
  }
  return team[0];
}

function makeGoals(team, count, side) {
  return Array.from({ length: count }, () => {
    const scorer = pickScorer(team);
    return { minute: randInt(1, 90), playerId: scorer.id, playerName: scorer.name, side };
  });
}

// 10 oyunçunu təsadüfi 5 + 5 böl, qalibi komandaların gücünə görə seç, hesab və qolları yarat
export function drawMatch() {
  const mixed = shuffle(PLAYERS);
  const team1 = mixed.slice(0, TEAM_SIZE);
  const team2 = mixed.slice(TEAM_SIZE, TEAM_SIZE * 2);
  const chance1 = winProbability(team1, team2);
  const team1Wins = Math.random() < chance1;
  const pct1 = Math.round(chance1 * 100);

  // Qalibin qolu həmişə məğlubdan çox olur
  const winnerGoals = randInt(1, 5);
  const loserGoals = randInt(0, winnerGoals - 1);
  const score = {
    team1: team1Wins ? winnerGoals : loserGoals,
    team2: team1Wins ? loserGoals : winnerGoals,
  };

  const events = [
    ...makeGoals(team1, score.team1, "team1"),
    ...makeGoals(team2, score.team2, "team2"),
  ].sort((a, b) => a.minute - b.minute);

  // Oyunçu başına qol sayı
  const goals = {};
  events.forEach((e) => {
    goals[e.playerId] = (goals[e.playerId] ?? 0) + 1;
  });

  // Ən yaxşı oyunçu: qalib komandada ən çox qol vuran (bərabər olsa təsadüfi)
  const winners = team1Wins ? team1 : team2;
  const best = Math.max(...winners.map((p) => goals[p.id] ?? 0));
  const mvp = pickRandom(winners.filter((p) => (goals[p.id] ?? 0) === best));

  // Əlavə hadisələr + şərh + statistika üçün tam hadisə xətti
  const { timeline, meta } = buildTimeline({
    teams: { team1, team2 },
    goals: events,
    power: { team1: teamPower(team1), team2: teamPower(team2) },
  });

  return {
    timeline,
    meta,
    teams: [
      { name: "Team 1", team: team1, total: totalRating(team1), result: team1Wins ? "winner" : "lose" },
      { name: "Team 2", team: team2, total: totalRating(team2), result: team1Wins ? "lose" : "winner" },
    ],
    score,
    winChance: { team1: pct1, team2: 100 - pct1 },
    events,
    goals,
    mvpId: mvp.id,
  };
}
