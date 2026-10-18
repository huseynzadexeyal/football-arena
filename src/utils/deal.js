// Kart paylama animasiyasının vaxtları (ms). CSS və App eyni dəyərlərdən istifadə edir.
export const DEAL_CARDS = 10; // 5 + 5
export const DEAL_STAGGER_MS = 140; // ardıcıl kartlar arasında fasilə
export const DEAL_MS = 650; // bir kartın uçuş müddəti
export const DEAL_TOTAL_MS = (DEAL_CARDS - 1) * DEAL_STAGGER_MS + DEAL_MS + 250;
