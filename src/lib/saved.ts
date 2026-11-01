// Wishlist and recently viewed bags, kept in the shopper's browser (no account needed).
import { useSyncExternalStore } from "react";

type Key = "ada-wishlist" | "ada-recent";
const listeners = new Set<() => void>();
const cache: Partial<Record<Key, string[]>> = {};
const EMPTY: string[] = [];

function read(key: Key): string[] {
  if (cache[key]) return cache[key]!;
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "[]");
    cache[key] = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    cache[key] = [];
  }
  return cache[key]!;
}

function write(key: Key, list: string[]) {
  cache[key] = list;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // private mode: kept for this visit only
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  // another tab changed it
  const onStorage = (e: StorageEvent) => {
    if (e.key === "ada-wishlist" || e.key === "ada-recent") {
      delete cache[e.key];
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

const useList = (key: Key) =>
  useSyncExternalStore(
    subscribe,
    () => read(key),
    () => EMPTY,
  );

/** Saved bags: the heart on cards and product pages. */
export function useWishlist() {
  const list = useList("ada-wishlist");
  return {
    list,
    has: (slug: string) => list.includes(slug),
    toggle: (slug: string) =>
      write("ada-wishlist", list.includes(slug) ? list.filter((s) => s !== slug) : [slug, ...list]),
  };
}

/** The last bags looked at, newest first. */
export function useRecent() {
  return useList("ada-recent");
}

export function markViewed(slug: string) {
  write("ada-recent", [slug, ...read("ada-recent").filter((s) => s !== slug)].slice(0, 8));
}
