import { useEffect, useMemo, useRef, useState } from "react";
import { drawMatch } from "./utils/teams";
import { DEAL_CARDS, DEAL_MS, DEAL_STAGGER_MS, DEAL_TOTAL_MS } from "./utils/deal";
import { FULL_TIME_MS, GOAL_FLASH_MS, HALF_TIME_MS, TICK_MS } from "./utils/timing";
import { cardsByPlayer } from "./utils/timeline";
import { openPack } from "./utils/packs";
import * as sound from "./utils/sound";
import {
  Banner,
  Button,
  CommentaryPanel,
  CommentaryTicker,
  Confetti,
  EventToast,
  GoalFlash,
  Kickoff,
  MatchEvents,
  MatchStats,
  PackOpening,
  PlayerModal,
  Scoreboard,
  Stadium,
  TeamSection,
} from "./components";
import styles from "./App.module.css";

// Oyunun mərhələləri:
// dealing → ready → countdown → live ⇄ halftime → fulltime → finished
// Matç hadisələri görünən mərhələlər (paylama / start sayımında şərh boşdur)
const MATCH_PHASES = ["live", "halftime", "fulltime", "finished"];
const IDLE_TEXT = {
  dealing: "Dealing the cards…",
  ready: "Press Start Game for kick-off",
  countdown: "The teams are lining up…",
};
const TOAST_MS = 2100;
const TOAST_TYPES = ["yellow", "red", "post"];

const BUTTON = {
  dealing: { label: "Dealing…", disabled: true },
  ready: { label: "Start Game", disabled: false },
  countdown: { label: "Kick-off…", disabled: true },
  live: { label: "Live…", disabled: true },
  halftime: { label: "Half time", disabled: true },
  fulltime: { label: "Full time", disabled: true },
  finished: { label: "New Game", disabled: false },
};

export default function App() {
  // Komandalar və nəticə əvvəlcədən yaranır; oyun gedəndə taymerə görə addım-addım açılır
  const [match, setMatch] = useState(drawMatch);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState("dealing");
  const [clock, setClock] = useState(0); // oyun dəqiqəsi (0..90)
  const [celebrate, setCelebrate] = useState(false); // qol animasiyası göstərilir
  const [muted, setMuted] = useState(sound.isMuted);
  const [selected, setSelected] = useState(null);
  const [panel, setPanel] = useState(null); // "commentary" | "stats" | null
  const [toast, setToast] = useState(null); // kart / dirək bildirişi
  const [pack, setPack] = useState(null); // açılan paket: { cards, owned }
  const [packOpened, setPackOpened] = useState(false); // hər matça bir paket

  const { teams, events, timeline, meta, mvpId, winChance } = match;
  const [first, second] = teams;
  const finished = phase === "finished";

  // Taymer vaxtı çatmış qollar "vurulmuş" sayılır (events dəqiqəyə görə sıralıdır)
  const shown = useMemo(() => events.filter((e) => e.minute <= clock).length, [events, clock]);

  const { score, goals } = useMemo(() => {
    const score = { team1: 0, team2: 0 };
    const goals = {};
    events.slice(0, shown).forEach((e) => {
      score[e.side] += 1;
      goals[e.playerId] = (goals[e.playerId] ?? 0) + 1;
    });
    return { score, goals };
  }, [events, shown]);

  // Şərh lenti: hadisələr oyun dəqiqəsinə çatanda açılır ("Full time" yalnız final fitindən sonra)
  const inMatch = MATCH_PHASES.includes(phase);
  const feed = useMemo(
    () =>
      inMatch
        ? timeline.filter((e) => e.minute <= clock && (e.type !== "fulltime" || phase === "fulltime" || finished))
        : [],
    [timeline, clock, inMatch, phase, finished]
  );
  const latest = feed.length ? feed[feed.length - 1] : null;
  const cards = useMemo(() => cardsByPlayer(feed), [feed]);

  const lastGoal = shown > 0 ? events[shown - 1] : null;
  const winnerSide = first.result === "winner" ? "team1" : "team2";

  // Brauzer səsə yalnız istifadəçi toxunuşundan sonra icazə verir
  useEffect(() => {
    const unlock = () => sound.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      sound.ambience(false);
    };
  }, []);

  // Mərhələ zamanlayıcıları: paylama, oyun dəqiqələri, fasilə, final fiti
  useEffect(() => {
    let id;
    if (phase === "dealing") {
      id = setTimeout(() => setPhase("ready"), DEAL_TOTAL_MS);
    } else if (phase === "live") {
      id = setTimeout(() => {
        if (clock >= 90) setPhase("fulltime");
        else if (clock === 44) {
          setClock(45);
          setPhase("halftime");
        } else setClock(clock + 1);
      }, TICK_MS);
    } else if (phase === "halftime") {
      id = setTimeout(() => setPhase("live"), HALF_TIME_MS);
    } else if (phase === "fulltime") {
      id = setTimeout(() => setPhase("finished"), FULL_TIME_MS);
    }
    return () => clearTimeout(id);
  }, [phase, clock]);

  // Kart paylama səsləri (hər kartın yerinə düşdüyü anda)
  useEffect(() => {
    if (phase !== "dealing") return;
    const ids = Array.from({ length: DEAL_CARDS }, (_, i) =>
      setTimeout(sound.card, i * DEAL_STAGGER_MS + DEAL_MS * 0.7)
    );
    return () => ids.forEach(clearTimeout);
  }, [phase, round]);

  // Mərhələ səsləri: stadion küyü, fasilə/final fitləri, qələbə fanfarı
  useEffect(() => {
    if (phase === "live") {
      sound.ambience(true);
      if (clock === 45) sound.whistle(1); // ikinci hissənin start fiti
    } else if (phase === "halftime") {
      sound.ambience(false);
      sound.whistle(2);
    } else if (phase === "fulltime") {
      sound.ambience(false);
      sound.whistle(3);
    } else if (phase === "finished") {
      sound.fanfare();
    }
    // yalnız mərhələ dəyişəndə işləsin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Qol düşəndə: səs + "GOAL!" animasiyası + stadion işıqları
  const prevShown = useRef(0);
  useEffect(() => {
    if (shown > prevShown.current) {
      prevShown.current = shown;
      sound.goal();
      setCelebrate(true);
      const id = setTimeout(() => setCelebrate(false), GOAL_FLASH_MS);
      return () => clearTimeout(id);
    }
    prevShown.current = shown;
  }, [shown]);

  // Əlavə hadisələr: səs + kart / dirək bildirişi (qol yuxarıda ayrıca işlənir)
  const prevFeedId = useRef(null);
  useEffect(() => {
    if (!latest) {
      prevFeedId.current = null;
      return;
    }
    if (latest.id === prevFeedId.current) return;
    prevFeedId.current = latest.id;
    if (phase !== "live") return;
    if (latest.type === "yellow" || latest.type === "red") sound.whistleShort();
    else if (latest.type === "post") sound.post();
    else if (latest.type === "save") sound.ooh();
    if (TOAST_TYPES.includes(latest.type)) {
      setToast(latest);
      const id = setTimeout(() => setToast(null), TOAST_MS);
      return () => clearTimeout(id);
    }
  }, [latest, phase]);

  const startGame = () => {
    sound.click();
    setPhase("countdown");
  };

  const newGame = () => {
    sound.click();
    setMatch(drawMatch());
    setClock(0);
    setCelebrate(false);
    setSelected(null);
    setPanel(null);
    setToast(null);
    setPack(null);
    setPackOpened(false);
    setRound((r) => r + 1); // kartlar yenidən paylanır
    setPhase("dealing");
  };

  const togglePanel = (name) => {
    sound.unlock();
    sound.click();
    setPanel((p) => (p === name ? null : name));
  };

  const claimPack = () => {
    sound.click();
    // matçda nə qədər çox qol olsa, nadir kart şansı bir o qədər çox
    const luck = Math.min(1.5, (score.team1 + score.team2) * 0.2);
    setPack(openPack({ luck }));
    setPackOpened(true);
  };

  const toggleSound = () => {
    sound.unlock();
    sound.setMuted(!muted);
    setMuted(!muted);
  };

  const { label, disabled } = BUTTON[phase];

  return (
    <>
      <Stadium boost={phase === "countdown" || celebrate} />

      {phase === "dealing" && (
        <div
          className={styles.deck}
          style={{ "--out-delay": `${DEAL_TOTAL_MS - 400}ms` }}
          aria-hidden="true"
        />
      )}
      {phase === "countdown" && <Kickoff onDone={() => setPhase("live")} />}
      {celebrate && lastGoal && (
        <GoalFlash key={shown} goal={lastGoal} teamName={teams[lastGoal.side === "team1" ? 0 : 1].name} />
      )}
      {phase === "halftime" && (
        <Banner
          title="HALF TIME"
          sub={`${first.name}  ${score.team1} : ${score.team2}  ${second.name}`}
          durationMs={HALF_TIME_MS}
        />
      )}
      {phase === "fulltime" && (
        <Banner
          title="FULL TIME"
          sub={`${first.name}  ${score.team1} : ${score.team2}  ${second.name}`}
          durationMs={FULL_TIME_MS}
        />
      )}
      {finished && (
        <Confetti
          key={round}
          variant="rain"
          count={70}
          colors={winnerSide === "team1" ? ["#4aa3ff", "#ffffff", "#ffd24d"] : ["#ff9f43", "#ffffff", "#ffd24d"]}
        />
      )}

      <EventToast key={toast?.id} event={toast} />

      <button
        type="button"
        className={styles.tool}
        onClick={() => togglePanel("commentary")}
        aria-label="Live commentary"
        aria-pressed={panel === "commentary"}
        title="Live commentary"
      >
        💬
      </button>
      <button
        type="button"
        className={styles.tool}
        onClick={() => togglePanel("stats")}
        aria-label="Match statistics"
        aria-pressed={panel === "stats"}
        title="Match statistics"
      >
        📊
      </button>

      <button
        type="button"
        className={styles.mute}
        onClick={toggleSound}
        aria-label={muted ? "Turn sound on" : "Turn sound off"}
        aria-pressed={muted}
      >
        {muted ? "🔇" : "🔊"}
      </button>

      <main className={styles.page}>
        <div className={styles.top}>
          <Button variant="success" disabled={disabled} onClick={finished ? newGame : startGame}>
            {label}
          </Button>
        </div>

        <TeamSection
          name={first.name}
          team={first.team}
          total={first.total}
          result={first.result}
          goals={goals}
          cards={cards}
          mvpId={finished ? mvpId : null}
          revealed={finished}
          round={round}
          side="top"
          onMore={setSelected}
        />

        <div className={styles.middle}>
          <Scoreboard
            team1={first.name}
            team2={second.name}
            score={score}
            chance={winChance}
            minute={clock}
            phase={phase}
            tickMs={TICK_MS}
          />
          <MatchEvents events={events.slice(0, shown)} />
          <div className={styles.tickRow}>
            {finished ? (
              <>
                <Button size="sm" onClick={() => togglePanel("stats")}>📊 Match Stats</Button>
                <Button size="sm" variant="gold" disabled={packOpened} onClick={claimPack}>
                  {packOpened ? "Pack opened ✓" : "🎁 Open Pack"}
                </Button>
              </>
            ) : (
              <CommentaryTicker item={latest} placeholder={IDLE_TEXT[phase]} />
            )}
          </div>
        </div>

        <TeamSection
          name={second.name}
          team={second.team}
          total={second.total}
          result={second.result}
          goals={goals}
          cards={cards}
          mvpId={finished ? mvpId : null}
          revealed={finished}
          round={round}
          side="bottom"
          onMore={setSelected}
        />
      </main>

      <CommentaryPanel open={panel === "commentary"} feed={feed} onClose={() => setPanel(null)} />
      <MatchStats
        open={panel === "stats"}
        onClose={() => setPanel(null)}
        teams={teams}
        score={score}
        minute={clock}
        phase={phase}
        items={feed}
        meta={meta}
        mvpId={mvpId}
      />
      {pack && <PackOpening pack={pack.cards} owned={pack.owned} onClose={() => setPack(null)} />}

      <PlayerModal
        player={selected}
        goals={selected ? (goals[selected.id] ?? 0) : 0}
        isMvp={finished && selected?.id === mvpId}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
