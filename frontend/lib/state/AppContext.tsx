"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import type {
  ConfirmedProfileField,
  DocumentRecord,
  ExtractedField,
  FieldUpdate,
  SessionResponse,
} from "@/types/domain";

/** Field names that feed the income calculation; correcting one makes it stale. */
const CALCULATION_FIELDS = new Set(["gross_pay", "income", "net_pay"]);

export interface AccessibilityPrefs {
  largerText: boolean;
  reducedMotion: boolean;
}

export interface AppState {
  session: SessionResponse | null;
  consented: boolean;
  householdSize: number;
  /** Documents keyed by documentId, holding extracted fields + safe metadata. */
  documents: Record<string, DocumentRecord>;
  /** True when a confirmed value changed and the fit-check math is out of date. */
  calculationStale: boolean;
  /** Packet inclusion toggles keyed by local document ID. */
  packetSelections: Record<string, boolean>;
  prefs: AccessibilityPrefs;
}

const initialState: AppState = {
  session: null,
  consented: false,
  householdSize: 1,
  documents: {},
  calculationStale: false,
  packetSelections: {},
  prefs: { largerText: false, reducedMotion: false },
};

export type AppAction =
  | { type: "SET_SESSION"; session: SessionResponse }
  | { type: "SET_CONSENT"; consented: boolean }
  | { type: "SET_HOUSEHOLD_SIZE"; size: number }
  | { type: "UPSERT_DOCUMENT"; document: DocumentRecord }
  | { type: "REMOVE_DOCUMENT"; documentId: string }
  | { type: "UPDATE_FIELD"; documentId: string; field: FieldUpdate }
  | { type: "ADD_FIELD"; documentId: string; field: ExtractedField }
  | { type: "SET_CALCULATION_STALE"; stale: boolean }
  | { type: "TOGGLE_PACKET_DOC"; documentId: string }
  | { type: "SET_PREF"; key: keyof AccessibilityPrefs; value: boolean }
  | { type: "HYDRATE"; state: Partial<AppState> }
  | { type: "RESET" };

/** sessionStorage key for restoring session state across reloads/direct nav. */
const STORAGE_KEY = "proofsetu.session.v1";

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_SESSION":
      return { ...state, session: action.session };

    case "SET_CONSENT":
      return { ...state, consented: action.consented };

    case "SET_HOUSEHOLD_SIZE":
      return { ...state, householdSize: action.size };

    case "UPSERT_DOCUMENT":
      return {
        ...state,
        documents: {
          ...state.documents,
          [action.document.documentId]: action.document,
        },
      };

    case "REMOVE_DOCUMENT": {
      const next = { ...state.documents };
      const nextSelections = { ...state.packetSelections };
      delete next[action.documentId];
      delete nextSelections[action.documentId];
      return { ...state, documents: next, packetSelections: nextSelections };
    }

    case "ADD_FIELD": {
      const doc = state.documents[action.documentId];
      if (!doc) return state;
      // Replace if a field with this name already exists, else append.
      const exists = doc.fields.some((f) => f.name === action.field.name);
      const fields = exists
        ? doc.fields.map((f) =>
            f.name === action.field.name ? action.field : f
          )
        : [...doc.fields, action.field];
      return {
        ...state,
        documents: { ...state.documents, [action.documentId]: { ...doc, fields } },
      };
    }

    case "UPDATE_FIELD": {
      const doc = state.documents[action.documentId];
      if (!doc) return state;
      const nextFields = doc.fields.map((f) =>
        f.name === action.field.name
          ? { ...f, value: action.field.value, state: action.field.state }
          : f
      );
      const makesStale =
        action.field.state === "corrected" &&
        CALCULATION_FIELDS.has(action.field.name);
      return {
        ...state,
        documents: {
          ...state.documents,
          [action.documentId]: { ...doc, fields: nextFields },
        },
        calculationStale: makesStale ? true : state.calculationStale,
      };
    }

    case "SET_CALCULATION_STALE":
      return { ...state, calculationStale: action.stale };

    case "TOGGLE_PACKET_DOC": {
      const current = state.packetSelections[action.documentId] ?? true;
      return {
        ...state,
        packetSelections: {
          ...state.packetSelections,
          [action.documentId]: !current,
        },
      };
    }

    case "SET_PREF":
      return { ...state, prefs: { ...state.prefs, [action.key]: action.value } };

    case "HYDRATE":
      // Restore persisted session, merging over the initial shape defensively.
      return {
        ...state,
        ...action.state,
        prefs: { ...state.prefs, ...(action.state.prefs ?? {}) },
      };

    case "RESET":
      return { ...initialState, prefs: state.prefs };

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  /** Derived: confirmed/corrected fields only, flattened across documents. */
  confirmedFields: ConfirmedProfileField[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydrated = useRef(false);

  // Restore any persisted session AFTER mount so confirmed fields, the corrected
  // income, household size, and selections survive a reload or direct navigation
  // to a later step. Running post-mount avoids an SSR hydration mismatch.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "HYDRATE", state: JSON.parse(raw) as Partial<AppState> });
    } catch {
      // Ignore unavailable/corrupt storage; fall back to a fresh session.
    }
    hydrated.current = true;
  }, []);

  // Persist on change (only once hydration has run, so we never clobber stored
  // state with the initial value on first paint). When the session has been
  // deleted/reset (no session, no consent, no documents), remove the key so
  // "Delete everything" leaves sessionStorage empty.
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      const isCleared =
        !state.session &&
        !state.consented &&
        Object.keys(state.documents).length === 0;
      if (isCleared) {
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch {
      // Storage may be full or blocked; the app still works in-memory.
    }
  }, [state]);

  const confirmedFields = useMemo<ConfirmedProfileField[]>(() => {
    return Object.values(state.documents).flatMap((doc) =>
      doc.fields
        .filter((f) => f.state === "confirmed" || f.state === "corrected")
        .map((f) => ({
          documentId: doc.documentId,
          name: f.name,
          value: f.value,
          state: f.state,
        }))
    );
  }, [state.documents]);

  const value = useMemo(
    () => ({ state, dispatch, confirmedFields }),
    [state, confirmedFields]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppStateProvider");
  return ctx;
}
