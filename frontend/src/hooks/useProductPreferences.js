import { useEffect, useMemo, useSyncExternalStore } from "react";
import { productById } from "../utils/catalog";
import {
  getRecentProductIds,
  getSavedProductIds,
  replaceSavedProductIds,
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
  const validSavedIds = useMemo(() => savedIds.filter((id) => productById.has(id)), [savedIds]);
  const savedProducts = useMemo(
    () => validSavedIds.map((id) => productById.get(id)).filter(Boolean),
    [validSavedIds],
  );
  const recentProducts = useMemo(
    () => recentIds.map((id) => productById.get(id)).filter(Boolean),
    [recentIds],
  );

  useEffect(() => {
    if (validSavedIds.length !== savedIds.length) replaceSavedProductIds(validSavedIds);
  }, [savedIds, validSavedIds]);

  return {
    savedIds: validSavedIds,
    recentIds,
    savedProducts,
    recentProducts,
  };
};
