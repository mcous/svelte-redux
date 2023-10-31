import type { Action } from "redux";

export interface Options<T> {
  name: string;
  get: () => T;
  set: (value: T) => void;
}

export interface Devtools<T> {
  send: (action: { type: "set" | "update"; payload: T }, state: T) => void;
  disconnect: () => void;
}

interface ReduxDevtoolsExtension {
  connect: <T>(config: ReduxDevtoolsConfig) => ReduxDevtools<T>;
  disconnect: () => void;
}

interface ReduxDevtoolsConfig {
  name?: string;
  trace?: boolean;
}

interface ReduxDevtools<T> {
  init: (state: T) => void;
  send: (action: Action<unknown>, state: T) => void;
  subscribe: (
    eventListener: (event: ReduxDevtoolsEvent<T>) => void
  ) => () => void;
}

type ReduxDevtoolsEvent<T> = StartEvent | DispatchEvent<T> | ActionEvent<T>;

interface StartEvent {
  type: "START";
  state: undefined;
}

interface DispatchEvent<T> {
  type: "DISPATCH";
  state: T | undefined;
  payload:
    | { type: "RESET" }
    | { type: "JUMP_TO_ACTION" }
    | { type: "ROLLBACK" }
    | { type: "COMMIT" };
}

interface ActionEvent<T> {
  type: "ACTION";
  state: undefined;
  payload: string;
}

export function connect<T>(
  initialValue: T,
  options: Options<T>
): Devtools<T> | undefined {
  if (
    typeof window === "undefined" ||
    typeof window.__REDUX_DEVTOOLS_EXTENSION__?.connect !== "function"
  ) {
    return undefined;
  }

  const { name, get, set } = options;
  const devtools = window.__REDUX_DEVTOOLS_EXTENSION__?.connect<T>({ name });
  let committedValue = initialValue;

  devtools.init(initialValue);
  const unsubscribe = devtools.subscribe(handleDevtoolsEvent);

  return { send: devtools.send, disconnect };

  function disconnect(): void {
    unsubscribe();
    window.__REDUX_DEVTOOLS_EXTENSION__?.disconnect();
  }

  function handleDevtoolsEvent(event: ReduxDevtoolsEvent<T>): void {
    if (event.type === "DISPATCH") {
      handleDispatch(event);
    } else if (event.type === "ACTION") {
      handleAction(event);
    }
  }

  function handleDispatch(event: DispatchEvent<T>): void {
    const { payload, state } = event;

    switch (payload.type) {
      case "JUMP_TO_ACTION": {
        if (state) {
          set(state);
        }
        break;
      }

      case "RESET": {
        set(initialValue);
        devtools.init(initialValue);
        break;
      }

      case "COMMIT": {
        committedValue = get();
        set(committedValue);
        devtools.init(committedValue);
        break;
      }

      case "ROLLBACK": {
        set(committedValue);
        break;
      }
    }
  }

  function handleAction(event: ActionEvent<T>): void {
    const nextState = JSON.parse(event.payload) as T;
    set(nextState);
  }
}

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: ReduxDevtoolsExtension;
  }
}
