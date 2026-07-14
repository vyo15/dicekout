import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { consumeCatalogScroll } from "../utils/catalogNavigation";

export const useCatalogScrollRestoration = () => {
  const location = useLocation();

  useEffect(() => {
    const route = `${location.pathname}${location.search}`;
    const target = consumeCatalogScroll(route);
    if (target === null) return undefined;

    let firstFrame = 0;
    let secondFrame = 0;
    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => window.scrollTo({ top: target, behavior: "auto" }));
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [location.pathname, location.search]);
};
