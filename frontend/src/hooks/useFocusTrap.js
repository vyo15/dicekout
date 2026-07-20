import { useEffect } from "react";

const DEFAULT_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const getFocusableElements = (container, selector) => Array.from(container?.querySelectorAll(selector) || [])
  .filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");

export const useFocusTrap = ({
  open,
  containerRef,
  initialFocusRef,
  onEscape,
  bodyClassName = "",
  focusableSelector = DEFAULT_SELECTOR,
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    if (bodyClassName) document.body.classList.add(bodyClassName);

    const focusFrame = window.requestAnimationFrame(() => {
      (initialFocusRef?.current || containerRef.current)?.focus?.();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscape?.();
        return;
      }

      if (event.key !== "Tab" || !containerRef.current) return;

      const focusable = getFocusableElements(containerRef.current, focusableSelector);
      if (!focusable.length) {
        event.preventDefault();
        containerRef.current.focus?.();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (!containerRef.current.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      if (bodyClassName) document.body.classList.remove(bodyClassName);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [bodyClassName, containerRef, focusableSelector, initialFocusRef, onEscape, open]);
};
