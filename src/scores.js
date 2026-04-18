// High score storage using localStorage
const STORAGE_KEY = 'rr_highscores';
const MAX_SCORES = 20;

export function getScores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}

export function addScore(initials, score, recordId, songId) {
  const scores = getScores();
  scores.push({ initials, score, recordId, songId, date: Date.now() });
  scores.sort((a, b) => b.score - a.score);
  scores.length = Math.min(scores.length, MAX_SCORES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  return scores;
}

export function getTopScores(limit = 10) {
  return getScores().slice(0, limit);
}
