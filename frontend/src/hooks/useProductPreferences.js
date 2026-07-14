import { useMemo, useSyncExternalStore } from "react";
import { productById } from "../utils/catalog";
import {
  getRecentProductIds,
  getSavedProductIds,
  subscribeProductPreferences,
} from "../utils/productPreferences";

const getSavedSnapshot = () => JSON.stringify(getSavedProductIds());
const getRecentSnapshot = () => JSON.stringify(getRecentProductIds());
const getServerSnapshot = () => "[]";

const parseSnapshot = (snapshot) => {
  try {
    return JSON.parse(snapshot);
  } catch {
    return [];
  }
};

export const useProductPreferences = () => {
  const savedSnapshot = useSyncExternalStore(
    subscribeProductPreferences,
    getSavedSnapshot,
    getServerSnapshot,
  );
  const recentSnapshot = useSyncExternalStore(
    subscribeProductPreferences,
    getRecentSnapshot,
    getServerSnapshot,
  );

  const savedIds = useMemo(() => parseSnapshot(savedSnapshot), [savedSnapshot]);
  const recentIds = useMemo(() => parseSnapshot(recentSnapshot), [recentSnapshot]);
  const savedProducts = useMemo(
    () => savedIds.map((id) => productById.get(id)).filter(Boolean),
    [savedIds],
  );
  const recentProducts = useMemo(
    () => recentIds.map((id) => productById.get(id)).filter(Boolean),
    [recentIds],
  );

  return { savedIds, recentIds, savedProducts, recentProducts };
};
