import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "ztp_my_zanzibar";

function readSavedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const SavedListContext = createContext(null);

// "My Zanzibar" (report section 8.5) - a lightweight save list, no account
// required. Stored as just an array of listing ids in localStorage; the
// actual listing data is always looked up fresh from live listings, so a
// saved item never shows stale info.
export function SavedListProvider({ children }) {
  const [savedIds, setSavedIds] = useState(() => readSavedIds());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
    } catch {
      // localStorage unavailable (private mode, quota, etc) - saves just
      // won't persist across reloads, but the app keeps working.
    }
  }, [savedIds]);

  const isSaved = useCallback((id) => savedIds.includes(id), [savedIds]);

  const toggleSaved = useCallback((id) => {
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const addMany = useCallback((ids) => {
    setSavedIds((prev) => Array.from(new Set([...prev, ...ids])));
  }, []);

  const removeAll = useCallback(() => setSavedIds([]), []);

  return (
    <SavedListContext.Provider value={{ savedIds, isSaved, toggleSaved, addMany, removeAll }}>
      {children}
    </SavedListContext.Provider>
  );
}

export function useSavedList() {
  const ctx = useContext(SavedListContext);
  if (!ctx) throw new Error("useSavedList must be used within SavedListProvider");
  return ctx;
}
