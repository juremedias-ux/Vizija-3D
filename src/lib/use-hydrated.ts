import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false v strežniškem izrisu in med hidracijo, nato true.
 * Uporablja se, da obrazec ni mogoče oddati, preden se naloži JavaScript
 * (sicer bi brskalnik obrazec poslal sam in podatke dodal v naslov URL).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
