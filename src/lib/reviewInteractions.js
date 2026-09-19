// src/lib/reviewInteractions.js
//
// This site has no traveler accounts, so "one helpful vote per person"
// and "which reviews has this browser already voted on" are tracked
// with a random per-browser token (localStorage) - the same trust model
// already used by connections.js and SavedListContext.jsx. The actual
// dedup that matters (stopping one browser voting twice on the same
// review) is enforced server-side by the vote_helpful() Postgres
// function's unique constraint - this local copy is just so the UI can
// grey out a button the visitor already pressed.

const TOKEN_KEY = "ztp_voter_token";
const VOTED_KEY = "ztp_voted_reviews";

export function getVoterToken() {
  try {
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      token =
        (crypto.randomUUID && crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  } catch {
    // localStorage unavailable - fall back to a per-load token. Voting
    // will still work, it just won't remember across reloads.
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function readVotedIds() {
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasVoted(reviewId) {
  return readVotedIds().includes(reviewId);
}

export function markVoted(reviewId) {
  try {
    const ids = readVotedIds();
    if (!ids.includes(reviewId)) {
      ids.push(reviewId);
      localStorage.setItem(VOTED_KEY, JSON.stringify(ids));
    }
  } catch {
    // Non-fatal - the vote itself still landed server-side.
  }
}
