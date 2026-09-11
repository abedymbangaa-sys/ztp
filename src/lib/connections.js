// src/lib/connections.js
//
// Tracks two kinds of "human" engagement on the site - listening to a
// Story Map pin, and reaching out to a Local Host - so the Passport
// (src/pages/MyZanzibar.jsx) can award a "Local Connection Stamp" for
// them. Mirrors the localStorage pattern already used by
// SavedListContext.jsx: a plain array of ids, no account required.

const STORAGE_KEY = "ztp_connections";

function readConnections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      storyPins: Array.isArray(parsed?.storyPins) ? parsed.storyPins : [],
      hosts: Array.isArray(parsed?.hosts) ? parsed.hosts : [],
    };
  } catch {
    return { storyPins: [], hosts: [] };
  }
}

function writeConnections(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable (private mode, quota, etc) - the stamp
    // just won't persist across reloads, but nothing breaks.
  }
}

export function markStoryHeard(pinId) {
  if (!pinId) return;
  const data = readConnections();
  if (!data.storyPins.includes(pinId)) {
    data.storyPins.push(pinId);
    writeConnections(data);
  }
}

export function markHostContacted(hostId) {
  if (!hostId) return;
  const data = readConnections();
  if (!data.hosts.includes(hostId)) {
    data.hosts.push(hostId);
    writeConnections(data);
  }
}

// Total distinct connections made - this is the "count" shown on the
// Local Connection stamp card, and earning it at all (count > 0) is what
// unlocks the stamp itself.
export function getConnectionCount() {
  const { storyPins, hosts } = readConnections();
  return storyPins.length + hosts.length;
}
