// Matçın tam hadisə xətti: qollar + əlavə hadisələr (zərbələr, künclər, kartlar...) + şərh mətnləri.
// Hamısı matç başlamazdan əvvəl yaranır; oyun gedəndə taymerə görə addım-addım açılır.
// Statistika (computeStats) də eyni xətdən hesablanır — ona görə rəqəmlər həmişə şərhlə üst-üstə düşür.

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const chance = (p) => Math.random() < p;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Çəkiyə görə seçim; heç kim yararlı deyilsə undefined
function pickWeighted(list, weight) {
  const total = list.reduce((sum, item) => sum + weight(item), 0);
  if (total <= 0) return undefined;
  let r = Math.random() * total;
  for (const item of list) {
    r -= weight(item);
    if (r < 0) return item;
  }
  return list[list.length - 1];
}

const SHOOTER_W = { FWD: 5, MID: 3, DEF: 1.2, GK: 0 };
const FOULER_W = { FWD: 1, MID: 3, DEF: 4, GK: 0 };
const ASSIST_W = { FWD: 3, MID: 4, DEF: 1.5, GK: 0.1 };
const CORNER_W = { FWD: 1, MID: 4, DEF: 2, GK: 0 };
const ANY_W = { FWD: 1, MID: 1, DEF: 1, GK: 0.15 };

export const EVENT_ICONS = {
  kickoff: "🔔",
  goal: "⚽",
  save: "🧤",
  post: "🥅",
  miss: "💨",
  blocked: "🛡️",
  corner: "🚩",
  foul: "🦶",
  yellow: "🟨",
  red: "🟥",
  offside: "🏴",
  injury: "🩹",
  halftime: "⏸️",
  fulltime: "🏁",
};

// ---- şərh şablonları ----
const T = {
  goal: [
    (p) => `GOAL! ${p} buries it in the bottom corner!`,
    (p) => `GOAL! ${p} thunders a shot into the top corner!`,
    (p) => `GOAL! ${p} slots it calmly past the keeper!`,
    (p) => `GOAL! A clinical finish from ${p}!`,
    (p) => `GOAL! ${p} rises highest and heads it home!`,
    (p) => `GOAL! ${p} curls it in from the edge of the box!`,
    (p) => `GOAL! ${p} guides it into the net — what a strike!`,
  ],
  penalty: [
    (p) => `PENALTY! ${p} steps up and sends the keeper the wrong way — GOAL!`,
    (p) => `PENALTY! ${p} hammers the spot-kick into the roof of the net!`,
  ],
  save: [
    (p, k) => `${p} lets fly… ${k} gets down low to save!`,
    (p, k) => `Brilliant stop! ${k} tips ${p}'s effort away.`,
    (p, k) => `${p} goes for power but ${k} is equal to it.`,
  ],
  blocked: [
    (p, d) => `${p} shoots — ${d} throws himself in the way to block!`,
    (p, d) => `${d} makes a vital block to stop ${p}.`,
  ],
  post: [
    (p) => `Off the post! ${p} can't believe it!`,
    (p) => `${p} hits the woodwork! So close!`,
    (p) => `Crack! ${p}'s shot rattles the crossbar!`,
  ],
  miss: [
    (p) => `${p} blazes it over the bar.`,
    (p) => `${p} drags it wide of the far post.`,
    (p) => `Good chance, but ${p} fires wide.`,
    (p) => `${p} snatches at it and the ball sails past the post.`,
  ],
  corner: [
    (p, _o, team) => `Corner to ${team}. ${p} swings it into the box.`,
    (p, _o, team) => `${team} win a corner — ${p} takes it short.`,
  ],
  foul: [
    (p, v) => `${p} brings down ${v}. Free kick.`,
    (p, v) => `Foul by ${p} on ${v}. The referee plays on… no, whistle!`,
    (p, v) => `${p} clips ${v} — free kick given.`,
  ],
  yellow: [
    (p) => `Yellow card! ${p} goes into the referee's book.`,
    (p) => `${p} is booked for a late challenge.`,
    (p) => `Yellow for ${p} after a cynical foul.`,
  ],
  red: [
    (p) => `RED CARD! ${p} sees a straight red for a reckless challenge!`,
    (p) => `RED CARD! ${p} is sent off — his team are down to four!`,
  ],
  secondYellow: [
    (p) => `Second yellow! ${p} is sent off — his team are down to four!`,
  ],
  offside: [
    (p) => `Flag up! ${p} is caught offside.`,
    (p) => `${p} was just a step ahead of the last defender — offside.`,
  ],
  injury: [
    (p) => `${p} goes down and needs treatment… he's able to continue.`,
    (p) => `Concern for ${p} after a heavy knock, but he runs it off.`,
  ],
};
const say = (key, ...args) => pick(T[key])(...args);

const teamName = (side) => (side === "team1" ? "Team 1" : "Team 2");
const other = (side) => (side === "team1" ? "team2" : "team1");

// teams: { team1: [players], team2: [players] }
// goals: [{ minute, playerId, playerName, side }] — drawMatch-in yaratdığı qollar
// power: { team1, team2 } — komandanın gücü (topa sahib olma üçün)
export function buildTimeline({ teams, goals, power }) {
  const byId = {};
  [...teams.team1, ...teams.team2].forEach((p) => {
    byId[p.id] = p;
  });
  const sentOff = {}; // playerId → qırmızı kart dəqiqəsi
  const lastInvolved = {}; // playerId → qol / assist dəqiqəsi
  const items = [];
  let seq = 0;
  const add = (item) => items.push({ ...item, id: `ev-${seq}`, seq: seq++ });

  const active = (side, minute) => teams[side].filter((p) => sentOff[p.id] === undefined || sentOff[p.id] > minute);
  const player = (side, minute, weights, exclude = []) =>
    pickWeighted(active(side, minute).filter((p) => !exclude.includes(p.id)), (p) => weights[p.position]);

  // 1) qollar (+ assist)
  goals.forEach((g) => {
    const scorer = byId[g.playerId];
    const penalty = chance(0.08);
    const assist = penalty || !chance(0.7)
      ? undefined
      : pickWeighted(teams[g.side].filter((p) => p.id !== scorer.id), (p) => ASSIST_W[p.position]);
    lastInvolved[scorer.id] = Math.max(lastInvolved[scorer.id] ?? 0, g.minute);
    if (assist) lastInvolved[assist.id] = Math.max(lastInvolved[assist.id] ?? 0, g.minute);
    const base = say(penalty ? "penalty" : "goal", scorer.shortName);
    add({
      minute: g.minute,
      type: "goal",
      side: g.side,
      playerId: scorer.id,
      playerName: scorer.name,
      assistId: assist?.id,
      assistName: assist?.name,
      penalty,
      text: assist ? `${base} Set up by ${assist.shortName}.` : base,
      big: true,
    });
  });

  // 2) nadir qırmızı kart (qol / assist verdikdən sonra; ya birbaşa, ya ikinci sarı)
  if (chance(0.1)) {
    const side = pick(["team1", "team2"]);
    const candidates = teams[side].filter((p) => p.position !== "GK" && (lastInvolved[p.id] ?? 0) <= 80);
    const p = candidates.length ? pick(candidates) : null;
    if (p) {
      const minute = rand(Math.max((lastInvolved[p.id] ?? 0) + 1, 22), 88);
      const second = chance(0.5);
      if (second) {
        const y = rand(8, minute - 4);
        add({ minute: y, type: "yellow", side, playerId: p.id, playerName: p.name, text: say("yellow", p.shortName), big: true, booked: true });
      }
      sentOff[p.id] = minute;
      add({
        minute,
        type: "red",
        side,
        playerId: p.id,
        playerName: p.name,
        secondYellow: second,
        text: say(second ? "secondYellow" : "red", p.shortName),
        big: true,
      });
    }
  }

  // 3) əlavə hadisələr: hər komanda üçün topa sahib olmaya görə çəkilmiş say
  const poss1 = clamp(Math.round(50 + (power.team1 - power.team2) * 0.6 + rand(-6, 6)), 36, 64);
  const possession = { team1: poss1, team2: 100 - poss1 };
  const booked = new Set(items.filter((e) => e.type === "yellow").map((e) => e.playerId));

  ["team1", "team2"].forEach((side) => {
    const opp = other(side);
    const mult = possession[side] / 50;
    const n = (lo, hi) => Math.max(0, Math.round(rand(lo, hi) * mult));
    const oppKeeper = teams[opp].find((p) => p.position === "GK");
    const minuteOf = () => rand(1, 90);

    // zərbələr: qapıçı varsa "save", yoxdursa müdafiəçi blok edir
    for (let i = 0, c = n(1, 5); i < c; i++) {
      const m = minuteOf();
      const shooter = player(side, m, SHOOTER_W);
      if (!shooter) continue;
      if (oppKeeper) {
        add({ minute: m, type: "save", side, playerId: shooter.id, playerName: shooter.name, otherId: oppKeeper.id, otherName: oppKeeper.name, text: say("save", shooter.shortName, oppKeeper.shortName) });
      } else {
        const d = player(opp, m, FOULER_W);
        if (!d) continue;
        add({ minute: m, type: "blocked", side, playerId: shooter.id, playerName: shooter.name, otherId: d.id, otherName: d.name, text: say("blocked", shooter.shortName, d.shortName) });
      }
    }
    for (let i = 0, c = n(1, 5); i < c; i++) {
      const m = minuteOf();
      const shooter = player(side, m, SHOOTER_W);
      if (shooter) add({ minute: m, type: "miss", side, playerId: shooter.id, playerName: shooter.name, text: say("miss", shooter.shortName) });
    }
    if (chance(0.3 * mult)) {
      const m = minuteOf();
      const shooter = player(side, m, SHOOTER_W);
      if (shooter) add({ minute: m, type: "post", side, playerId: shooter.id, playerName: shooter.name, text: say("post", shooter.shortName), big: true });
    }
    for (let i = 0, c = n(1, 6); i < c; i++) {
      const m = minuteOf();
      const taker = player(side, m, CORNER_W);
      if (taker) add({ minute: m, type: "corner", side, playerId: taker.id, playerName: taker.name, text: say("corner", taker.shortName, null, teamName(side)) });
    }
    for (let i = 0, c = n(0, 3); i < c; i++) {
      const m = minuteOf();
      const p = player(side, m, SHOOTER_W);
      if (p) add({ minute: m, type: "offside", side, playerId: p.id, playerName: p.name, text: say("offside", p.shortName) });
    }

    // fauller: bəziləri sarı karta çevrilir (hər oyunçu ən çox bir sarı)
    const fouls = rand(3, 8);
    let yellows = rand(0, 2);
    for (let i = 0; i < fouls; i++) {
      const m = minuteOf();
      const wantsCard = yellows > 0;
      const fouler = player(side, m, FOULER_W, wantsCard ? [...booked] : []);
      if (!fouler) continue;
      if (wantsCard) {
        yellows--;
        booked.add(fouler.id);
        add({ minute: m, type: "yellow", side, playerId: fouler.id, playerName: fouler.name, text: say("yellow", fouler.shortName), big: true });
        continue;
      }
      const victim = player(opp, m, ANY_W);
      if (victim) add({ minute: m, type: "foul", side, playerId: fouler.id, playerName: fouler.name, otherId: victim.id, otherName: victim.name, text: say("foul", fouler.shortName, victim.shortName) });
    }
  });

  // zədə: matçda ən çox bir dəfə, tam səhv gedən heç nə yoxdur (oyunçu davam edir)
  if (chance(0.18)) {
    const side = pick(["team1", "team2"]);
    const m = rand(5, 85);
    const p = player(side, m, ANY_W);
    if (p) add({ minute: m, type: "injury", side, playerId: p.id, playerName: p.name, text: say("injury", p.shortName) });
  }

  // 4) çərçivə hadisələri
  const goalsUntil = (min) => {
    const s = { team1: 0, team2: 0 };
    goals.forEach((g) => g.minute <= min && s[g.side]++);
    return s;
  };
  const ht = goalsUntil(45);
  const ft = goalsUntil(90);
  const winner = ft.team1 > ft.team2 ? "team1" : "team2";
  add({ minute: 0, type: "kickoff", side: null, text: "Kick-off! Team 1 vs Team 2 — the match is underway.", big: true, rank: -1 });
  add({ minute: 45, type: "halftime", side: null, text: `Half time. Team 1 ${ht.team1} : ${ht.team2} Team 2.`, big: true, rank: 1 });
  add({
    minute: 90,
    type: "fulltime",
    side: null,
    text: `Full time! ${teamName(winner)} win ${Math.max(ft.team1, ft.team2)}–${Math.min(ft.team1, ft.team2)}.`,
    big: true,
    rank: 1,
  });

  items.sort((a, b) => a.minute - b.minute || (a.rank ?? 0) - (b.rank ?? 0) || a.seq - b.seq);

  // 5) matç ölçüsündə sabit göstəricilər (topa sahib olma, ötürmə dəqiqliyi)
  const meta = {
    possession,
    passAcc: { team1: rand(74, 91), team2: rand(74, 91) },
    passes: {
      team1: Math.round((rand(260, 380) * possession.team1) / 50),
      team2: Math.round((rand(260, 380) * possession.team2) / 50),
    },
  };
  return { timeline: items, meta };
}

// Verilən hadisələrdən (artıq dəqiqəyə görə süzülmüş) komanda statistikası
export function computeStats(items, meta, minute = 90) {
  const blank = () => ({ goals: 0, shots: 0, onTarget: 0, corners: 0, fouls: 0, yellow: 0, red: 0, offsides: 0, saves: 0, woodwork: 0 });
  const stats = { team1: blank(), team2: blank() };
  const players = {}; // playerId → { goals, assists, saves, shots, yellow, red }
  const pl = (id) => (players[id] ??= { goals: 0, assists: 0, saves: 0, shots: 0, yellow: 0, red: 0 });

  items.forEach((e) => {
    if (!e.side) return;
    const s = stats[e.side];
    const o = stats[e.side === "team1" ? "team2" : "team1"];
    switch (e.type) {
      case "goal":
        s.goals++; s.shots++; s.onTarget++;
        pl(e.playerId).goals++; pl(e.playerId).shots++;
        if (e.assistId) pl(e.assistId).assists++;
        break;
      case "save":
        s.shots++; s.onTarget++; o.saves++;
        pl(e.playerId).shots++; pl(e.otherId).saves++;
        break;
      case "blocked":
        s.shots++; pl(e.playerId).shots++;
        break;
      case "post":
        s.shots++; s.woodwork++; pl(e.playerId).shots++;
        break;
      case "miss":
        s.shots++; pl(e.playerId).shots++;
        break;
      case "corner": s.corners++; break;
      case "offside": s.offsides++; break;
      case "foul": s.fouls++; break;
      case "yellow": s.fouls++; s.yellow++; pl(e.playerId).yellow++; break;
      case "red": s.fouls++; s.red++; pl(e.playerId).red++; break;
      default: break;
    }
  });

  // topa sahib olma 25-ci dəqiqəyə qədər 50/50-dən yekun dəyərə doğru dəyişir
  const k = Math.min(1, minute / 25);
  const poss1 = Math.round(50 + (meta.possession.team1 - 50) * k);
  stats.team1.possession = poss1;
  stats.team2.possession = 100 - poss1;
  const frac = clamp(minute / 90, 0, 1);
  ["team1", "team2"].forEach((side) => {
    stats[side].passes = Math.round(meta.passes[side] * frac);
    stats[side].passAcc = meta.passAcc[side];
  });
  return { stats, players };
}

// Sarı / qırmızı kartlar: playerId → "yellow" | "red" (oyunçu kartında nişan üçün)
export function cardsByPlayer(items) {
  const map = {};
  items.forEach((e) => {
    if (e.type === "yellow") map[e.playerId] = map[e.playerId] ?? "yellow";
    if (e.type === "red") map[e.playerId] = "red";
  });
  return map;
}
