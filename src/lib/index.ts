import { connect, type Devtools } from "./devtools";
import {
  get as getValue,
  writable as baseWritable,
  type Writable,
  type StartStopNotifier,
} from "svelte/store";

export function writable<T>(
  name: string,
  value: T | undefined,
  start?: StartStopNotifier<T> | undefined
): Writable<T> {
  const baseStore = baseWritable(value, startNotifier);
  let devtools: Devtools<T> | undefined;

  return { set, update, subscribe: baseStore.subscribe };

  function get(): T {
    return getValue(baseStore);
  }

  function set(nextValue: T): void {
    baseStore.set(nextValue);
    devtools?.send({ type: "set", payload: nextValue }, nextValue);
  }

  function update(getNextValue: (currentValue: T) => T): void {
    baseStore.update(getNextValue);
    devtools?.send({ type: "update", payload: get() }, get());
  }

  function startNotifier(baseSet: (nextValue: T) => void): () => void {
    devtools ??= connect(get(), { name, get, set: baseSet });

    const handleStop = start?.(set, update);

    return () => {
      devtools?.disconnect();
      devtools = undefined;
      handleStop?.();
    };
  }
}
