// Səs effektləri — hamısı Web Audio ilə sintez olunur (heç bir səs faylı lazım deyil).
// Brauzer ilk toxunuşdan (klik / toxunma) əvvəl səsə icazə vermir, ona görə unlock() çağırılmalıdır.

const KEY = "football-arena-muted";

let ctx = null;
let master = null;
let noiseBuf = null;
let amb = null; // fon izdiham səsi
let ambWanted = false;
let muted = false;
try {
  muted = localStorage.getItem(KEY) === "1";
} catch {
  /* localStorage əlçatmazdırsa, səs açıq qalır */
}

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);
  // 2 saniyəlik ağ küy — qırıntı, izdiham və fit səsləri üçün
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return ctx;
}

const ready = () => ctx && ctx.state === "running" && !muted;

export function unlock() {
  const c = ensure();
  if (c && c.state === "suspended") c.resume();
}

export const isMuted = () => muted;

export function setMuted(value) {
  muted = value;
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    /* mühüm deyil */
  }
  if (value) stopAmbience();
  else if (ambWanted) startAmbience();
}

// ---- kiçik tikə blokları ----
function noise(t, dur, { type = "bandpass", freq = 1000, freqEnd, q = 1, vol = 0.3, attack = 0.005 } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(freq, t);
  if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random());
  src.stop(t + dur + 0.05);
}

function tone(t, freq, dur, { type = "sine", vol = 0.25, attack = 0.01, freqEnd } = {}) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// Hakim fiti: yüksək ton + sürətli titrəyiş ("noxud" effekti) + nəfəs küyü
function blast(t, dur) {
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(2850, t);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 32;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 190;
  lfo.connect(lfoGain).connect(o.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
  g.gain.setValueAtTime(0.22, t + Math.max(0.04, dur - 0.06));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  lfo.start(t);
  o.stop(t + dur + 0.05);
  lfo.stop(t + dur + 0.05);
  noise(t, dur, { type: "highpass", freq: 3500, vol: 0.05, attack: 0.03 });
}

// ---- ictimai API ----

// Kartın masaya düşməsi
export function card() {
  if (!ready()) return;
  const t = ctx.currentTime;
  noise(t, 0.09, { type: "highpass", freq: 2200 + Math.random() * 900, vol: 0.22, attack: 0.004 });
  tone(t, 170, 0.07, { type: "triangle", vol: 0.14, freqEnd: 80 });
}

// Geri sayım siqnalı (3-2-1)
export function beep() {
  if (!ready()) return;
  tone(ctx.currentTime, 880, 0.16, { type: "square", vol: 0.12 });
}

// Fit: 1 = start, 2 = fasilə, 3 = final
export function whistle(times = 1) {
  if (!ready()) return;
  const t0 = ctx.currentTime;
  const patterns = { 1: [0.6], 2: [0.32, 0.32], 3: [0.22, 0.22, 0.75] };
  let t = t0;
  for (const dur of patterns[times] ?? patterns[1]) {
    blast(t, dur);
    t += dur + 0.13;
  }
}

// QOL! — izdiham gurultusu + sevinc melodiyası
export function goal() {
  if (!ready()) return;
  const t = ctx.currentTime;
  noise(t, 2.2, { freq: 450, freqEnd: 1600, q: 0.6, vol: 0.5, attack: 0.3 });
  noise(t, 2.0, { type: "lowpass", freq: 700, vol: 0.35, attack: 0.2 });
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone(t + 0.05 + i * 0.1, f, 0.35, { type: "triangle", vol: 0.16 })
  );
}

// Oyun bitəndə qələbə fanfarı
export function fanfare() {
  if (!ready()) return;
  const t = ctx.currentTime;
  noise(t, 2.4, { freq: 500, freqEnd: 1300, q: 0.6, vol: 0.4, attack: 0.4 });
  [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone(t + i * 0.13, f, i === 4 ? 0.9 : 0.3, { type: "square", vol: 0.09 })
  );
}

// Modal açılanda: sürətli "vuuuş" + parıltı
export function whoosh() {
  if (!ready()) return;
  const t = ctx.currentTime;
  noise(t, 0.45, { freq: 250, freqEnd: 3200, q: 1.2, vol: 0.28, attack: 0.12 });
  [880, 1318.5, 1760].forEach((f, i) => tone(t + 0.28 + i * 0.07, f, 0.22, { type: "sine", vol: 0.07 }));
}

// MVP üçün parıltı səsi
export function sparkle() {
  if (!ready()) return;
  const t = ctx.currentTime;
  [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(t + i * 0.06, f, 0.3, { type: "triangle", vol: 0.09 }));
}

export function click() {
  if (!ready()) return;
  tone(ctx.currentTime, 660, 0.06, { type: "triangle", vol: 0.12 });
}

// Qısa hakim fiti (faul, kart)
export function whistleShort() {
  if (!ready()) return;
  blast(ctx.currentTime, 0.22);
}

// Dirək / yan taxta: metal "dınnn"
export function post() {
  if (!ready()) return;
  const t = ctx.currentTime;
  tone(t, 520, 0.5, { type: "triangle", vol: 0.2, freqEnd: 480 });
  tone(t, 1040, 0.35, { type: "sine", vol: 0.1 });
  noise(t, 0.08, { type: "highpass", freq: 1800, vol: 0.2, attack: 0.002 });
}

// İzdihamın "ooo"su: təhlükəli an, qapıçı xilası
export function ooh() {
  if (!ready()) return;
  const t = ctx.currentTime;
  noise(t, 0.9, { freq: 350, freqEnd: 900, q: 0.8, vol: 0.28, attack: 0.25 });
}

// ---- kart paketi ----

// Paketin cırılması: uzun "ırrrt" + parıltı
export function packTear() {
  if (!ready()) return;
  const t = ctx.currentTime;
  noise(t, 0.55, { type: "bandpass", freq: 1200, freqEnd: 4200, q: 1.4, vol: 0.32, attack: 0.04 });
  noise(t + 0.05, 0.4, { type: "highpass", freq: 3000, vol: 0.14, attack: 0.02 });
}

// Paket açılanda işıq partlayışı
export function packBurst(tier = 0) {
  if (!ready()) return;
  const t = ctx.currentTime;
  noise(t, 0.9, { freq: 300, freqEnd: 2600, q: 0.7, vol: 0.34, attack: 0.05 });
  tone(t, 110, 0.6, { type: "sine", vol: 0.3, freqEnd: 50 });
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5].slice(0, 3 + Math.min(tier, 2));
  notes.forEach((f, i) => tone(t + 0.1 + i * 0.08, f, 0.5, { type: "triangle", vol: 0.1 }));
}

// Kartın çevrilməsi: tier 0..3 (bürünc → xüsusi) — nə qədər nadirdirsə, bir o qədər möhtəşəm
export function reveal(tier = 0) {
  if (!ready()) return;
  const t = ctx.currentTime;
  noise(t, 0.18, { type: "highpass", freq: 2500, vol: 0.2, attack: 0.005 });
  tone(t, 200, 0.12, { type: "triangle", vol: 0.16, freqEnd: 90 });
  if (tier >= 1) {
    [880, 1318.5, 1760, 2093].slice(0, 2 + tier).forEach((f, i) =>
      tone(t + 0.12 + i * 0.07, f, 0.3, { type: "sine", vol: 0.08 + tier * 0.02 })
    );
  }
  if (tier >= 3) {
    noise(t + 0.1, 1.6, { freq: 500, freqEnd: 1500, q: 0.6, vol: 0.38, attack: 0.3 });
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(t + 0.15 + i * 0.1, f, 0.8, { type: "square", vol: 0.07 })
    );
  }
}

// Stadionun fon səsi (oyun gedərkən yavaş-yavaş dalğalanan izdiham küyü)
function startAmbience() {
  if (amb || !ready()) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 650;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.07, t + 1);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.25;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.03;
  lfo.connect(lfoGain).connect(g.gain);
  src.connect(f).connect(g).connect(master);
  src.start();
  lfo.start();
  amb = { src, lfo, g };
}

function stopAmbience() {
  if (!amb) return;
  const { src, lfo, g } = amb;
  amb = null;
  const t = ctx.currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), t);
  g.gain.linearRampToValueAtTime(0.0001, t + 0.4);
  src.stop(t + 0.5);
  lfo.stop(t + 0.5);
}

export function ambience(on) {
  ambWanted = on;
  if (on) startAmbience();
  else stopAmbience();
}
