import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { load, save } from './storage';
import {
  INITIAL_STATE,
  type AppState,
  type SessionRecord,
  type Settings,
  type SetRecord,
} from './types';

type Action =
  | { type: 'finishSetup'; settings: Settings }
  | { type: 'setWeek'; week: number }
  | { type: 'startSession'; dayId: string; week: number }
  | { type: 'setStep'; index: number }
  | { type: 'logSet'; set: SetRecord }
  | { type: 'undoLastSet' }
  | { type: 'toggleWarmUp'; id: string }
  | { type: 'toggleCoolDown'; id: string }
  | { type: 'abandonSession' }
  | { type: 'finishSession'; bike: SessionRecord['bike'] }
  | { type: 'replaceAll'; state: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'finishSetup':
      return { ...state, settings: action.settings };

    case 'setWeek':
      return { ...state, currentWeek: Math.min(12, Math.max(1, action.week)) };

    case 'startSession':
      return {
        ...state,
        inProgress: {
          dayId: action.dayId,
          week: action.week,
          startedAt: new Date().toISOString(),
          stepIndex: 0,
          sets: [],
          warmUpDone: [],
          coolDownDone: [],
        },
      };

    case 'setStep':
      if (!state.inProgress) return state;
      return {
        ...state,
        inProgress: { ...state.inProgress, stepIndex: action.index },
      };

    case 'logSet':
      if (!state.inProgress) return state;
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          sets: [...state.inProgress.sets, action.set],
        },
      };

    case 'undoLastSet':
      if (!state.inProgress) return state;
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          sets: state.inProgress.sets.slice(0, -1),
        },
      };

    case 'toggleWarmUp': {
      if (!state.inProgress) return state;
      const done = state.inProgress.warmUpDone;
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          warmUpDone: done.includes(action.id)
            ? done.filter((d) => d !== action.id)
            : [...done, action.id],
        },
      };
    }

    case 'toggleCoolDown': {
      if (!state.inProgress) return state;
      const done = state.inProgress.coolDownDone;
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          coolDownDone: done.includes(action.id)
            ? done.filter((d) => d !== action.id)
            : [...done, action.id],
        },
      };
    }

    case 'abandonSession':
      return { ...state, inProgress: null };

    case 'finishSession': {
      const ip = state.inProgress;
      if (!ip) return state;

      // A session with nothing logged is not worth recording as a session.
      // She stopped before the first set; treat it as never started rather
      // than as a session she "failed".
      if (ip.sets.length === 0) return { ...state, inProgress: null };

      const record: SessionRecord = {
        id: `${ip.dayId}-w${ip.week}-${Date.now()}`,
        dayId: ip.dayId,
        week: ip.week,
        finishedAt: new Date().toISOString(),
        sets: ip.sets,
        bike: action.bike,
      };
      return { ...state, history: [...state.history, record], inProgress: null };
    }

    case 'replaceAll':
      return action.state;

    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  // Read straight from storage on the first render, so a reload lands back
  // exactly where she was rather than flashing an empty screen first.
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, load);

  // Save after every single change. The write is synchronous and tiny, so a
  // logged set is on disk before anything else happens — kill the app
  // mid-session and nothing is lost.
  useEffect(() => {
    save(state);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
