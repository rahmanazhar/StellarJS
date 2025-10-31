import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

/**
 * State management for StellarJS applications
 * Provides a simple Redux-like state management solution
 */

export type Action<T = any> = {
  type: string;
  payload?: T;
};

export type Reducer<S> = (state: S, action: Action) => S;

export type Dispatch = (action: Action) => void;

export interface StoreConfig<S> {
  initialState: S;
  reducer: Reducer<S>;
  middleware?: Middleware<S>[];
  devTools?: boolean;
}

export type ThunkAction<S> = (dispatch: Dispatch, getState: () => S) => any;

export type Middleware<S> = (store: {
  getState: () => S;
  dispatch: Dispatch;
}) => (next: Dispatch) => (action: Action | ThunkAction<S>) => void;

export interface Store<S> {
  getState: () => S;
  dispatch: Dispatch;
  subscribe: (listener: () => void) => () => void;
}

/**
 * Create a store with reducer and middleware
 */
export function createStore<S>(config: StoreConfig<S>): Store<S> {
  const { initialState, reducer, middleware = [], devTools = false } = config;

  let currentState = initialState;
  const listeners: (() => void)[] = [];

  const getState = () => currentState;

  const dispatch: Dispatch = (action) => {
    currentState = reducer(currentState, action);
    listeners.forEach((listener) => listener());

    if (devTools && typeof window !== 'undefined') {
      console.log('[StellarStore] Action:', action.type, action.payload);
      console.log('[StellarStore] New State:', currentState);
    }
  };

  const subscribe = (listener: () => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  };

  // Apply middleware
  let enhancedDispatch = dispatch;
  middleware.reverse().forEach((mw) => {
    enhancedDispatch = mw({ getState, dispatch })(enhancedDispatch);
  });

  return {
    getState,
    dispatch: enhancedDispatch,
    subscribe,
  };
}

/**
 * React Context for the store
 */
const StoreContext = createContext<Store<any> | null>(null);

/**
 * Provider component for the store
 */
export interface StoreProviderProps<S> {
  store: Store<S>;
  children: React.ReactNode;
}

export function StoreProvider<S>({ store, children }: StoreProviderProps<S>) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/**
 * Hook to access the store
 */
export function useStore<S>(): Store<S> {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return store as Store<S>;
}

/**
 * Hook to select state from the store
 */
export function useSelector<S, R>(selector: (state: S) => R): R {
  const store = useStore<S>();
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const selectedState = useMemo(() => selector(store.getState()), [store, selector]);

  React.useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const newState = selector(store.getState());
      if (newState !== selectedState) {
        forceUpdate();
      }
    });

    return unsubscribe;
  }, [store, selector, selectedState]);

  return selectedState;
}

/**
 * Hook to dispatch actions
 */
export function useDispatch(): Dispatch {
  const store = useStore();
  return store.dispatch;
}

/**
 * Hook to access both state and dispatch
 */
export function useStoreState<S>(): [S, Dispatch] {
  const store = useStore<S>();
  const state = useSelector((s: S) => s);
  return [state, store.dispatch];
}

/**
 * Built-in middleware
 */

// Logger middleware
export const loggerMiddleware: Middleware<any> =
  ({ getState }) =>
  (next) =>
  (action) => {
    if (typeof action === 'function') {
      // Pass thunks through to the next middleware
      return (next as any)(action);
    }
    console.group(action.type);
    console.log('Previous State:', getState());
    console.log('Action:', action);
    next(action);
    console.log('Next State:', getState());
    console.groupEnd();
  };

// Thunk middleware for async actions
export const thunkMiddleware: Middleware<any> =
  ({ dispatch, getState }) =>
  (next) =>
  (action) => {
    if (typeof action === 'function') {
      return action(dispatch, getState);
    }
    return next(action);
  };

// Performance monitoring middleware
export const perfMiddleware: Middleware<any> = () => (next) => (action) => {
  if (typeof action === 'function') {
    // Pass thunks through to the next middleware
    return (next as any)(action);
  }
  const start = performance.now();
  next(action);
  const end = performance.now();
  console.log(`[Performance] ${action.type} took ${(end - start).toFixed(2)}ms`);
};

/**
 * Action creators helper
 */
export function createAction<T = any>(type: string) {
  return (payload?: T): Action<T> => ({ type, payload });
}

/**
 * Reducer helper for combining multiple reducers
 */
export function combineReducers<S>(reducers: {
  [K in keyof S]: Reducer<S[K]>;
}): Reducer<S> {
  return (state: S, action: Action): S => {
    const nextState = {} as S;
    let hasChanged = false;

    Object.keys(reducers).forEach((key) => {
      const reducer = reducers[key as keyof S];
      const previousStateForKey = state[key as keyof S];
      const nextStateForKey = reducer(previousStateForKey, action);

      nextState[key as keyof S] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    });

    return hasChanged ? nextState : state;
  };
}

/**
 * Async action handler
 */
export function createAsyncThunk<T, R>(type: string, asyncFn: (arg: T) => Promise<R>) {
  return (arg: T) => async (dispatch: Dispatch) => {
    dispatch({ type: `${type}/pending` });

    try {
      const result = await asyncFn(arg);
      dispatch({ type: `${type}/fulfilled`, payload: result });
      return result;
    } catch (error) {
      dispatch({ type: `${type}/rejected`, payload: error });
      throw error;
    }
  };
}

/**
 * Persist middleware for localStorage
 */
export function createPersistMiddleware<S>(key: string, whitelist?: (keyof S)[]): Middleware<S> {
  return ({ getState }) =>
    (next) =>
    (action) => {
      if (typeof action === 'function') {
        // Pass thunks through to the next middleware
        return (next as any)(action);
      }

      next(action);

      const state = getState();
      let stateToSave = state;

      if (whitelist) {
        stateToSave = {} as S;
        whitelist.forEach((key) => {
          (stateToSave as any)[key] = state[key];
        });
      }

      try {
        localStorage.setItem(key, JSON.stringify(stateToSave));
      } catch (error) {
        console.error('Failed to persist state:', error);
      }
    };
}

/**
 * Load persisted state
 */
export function loadPersistedState<S>(key: string, initialState: S): S {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized) {
      return { ...initialState, ...JSON.parse(serialized) };
    }
  } catch (error) {
    console.error('Failed to load persisted state:', error);
  }
  return initialState;
}
