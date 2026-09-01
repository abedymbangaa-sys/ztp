import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "ztp_compare_list";
const MAX_COMPARE = 3;

function readCompareState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed.sectionKey === "string" && Array.isArray(parsed.ids)) {
      return parsed;
    }
  } catch {
    // ignore - fall through to default
  }
  return { sectionKey: null, ids: [] };
}

const CompareContext = createContext(null);

// Priority 3 (Compare Before You Choose) - a lightweight, no-account compare
// list, same storage pattern as SavedListContext. Scoped to ONE category at
// a time: comparing a hotel against a restaurant isn't a real decision a
// visitor makes, so picking an item from a new category clears the old
// selection instead of mixing categories in one table.
export function CompareProvider({ children }) {
  const [state, setState] = useState(() => readCompareState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage unavailable - compare list just won't persist reloads
    }
  }, [state]);

  const isComparing = useCallback(
    (id, sectionKey) => state.sectionKey === sectionKey && state.ids.includes(id),
    [state]
  );

  const toggleCompare = useCallback((id, sectionKey) => {
    setState((prev) => {
      // Different category selected - start a fresh list for it.
      if (prev.sectionKey !== sectionKey) {
        return { sectionKey, ids: [id] };
      }
      if (prev.ids.includes(id)) {
        const ids = prev.ids.filter((x) => x !== id);
        return { sectionKey: ids.length ? sectionKey : null, ids };
      }
      if (prev.ids.length >= MAX_COMPARE) return prev; // cap reached, no-op
      return { sectionKey, ids: [...prev.ids, id] };
    });
  }, []);

  const clearCompare = useCallback(() => setState({ sectionKey: null, ids: [] }), []);

  return (
    <CompareContext.Provider
      value={{
        sectionKey: state.sectionKey,
        compareIds: state.ids,
        isComparing,
        toggleCompare,
        clearCompare,
        maxCompare: MAX_COMPARE,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompareList() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompareList must be used within CompareProvider");
  return ctx;
}
