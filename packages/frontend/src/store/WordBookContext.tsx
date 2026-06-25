import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { WordBookRecord } from "../types";

interface WordBookState {
  selectedBook: WordBookRecord | null;
}

type WordBookAction = { type: "SELECT_BOOK"; book: WordBookRecord } | { type: "CLEAR" };

function reducer(state: WordBookState, action: WordBookAction): WordBookState {
  switch (action.type) {
    case "SELECT_BOOK":
      return { ...state, selectedBook: action.book };
    case "CLEAR":
      return { ...state, selectedBook: null };
    default:
      return state;
  }
}

const WordBookContext = createContext<{
  state: WordBookState;
  selectBook: (book: WordBookRecord) => void;
  clearSelection: () => void;
} | null>(null);

export function WordBookProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    selectedBook: null,
  });

  const selectBook = (book: WordBookRecord) => dispatch({ type: "SELECT_BOOK", book });
  const clearSelection = () => dispatch({ type: "CLEAR" });

  return (
    <WordBookContext.Provider value={{ state, selectBook, clearSelection }}>
      {children}
    </WordBookContext.Provider>
  );
}

export function useWordBook() {
  const ctx = useContext(WordBookContext);
  if (!ctx) {
    throw new Error("useWordBook must be used within WordBookProvider");
  }
  return ctx;
}
