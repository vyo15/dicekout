import { useEffect, useId, useRef } from "react";
import { FiX } from "react-icons/fi";

const getFocusableElements = (container) => Array.from(container.querySelectorAll(
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
)).filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");

const BottomSheet = ({ open, onClose, title, children }) => {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    document.body.classList.add("bottom-sheet-open");

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = getFocusableElements(panelRef.current);
      if (!focusable.length) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!panelRef.current.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.classList.remove("bottom-sheet-open");
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="bottom-sheet-layer">
      <button
        className="bottom-sheet__backdrop"
        type="button"
        onClick={onClose}
        tabIndex={-1}
        aria-hidden="true"
      />
      <section
        className="bottom-sheet"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="bottom-sheet__handle" aria-hidden="true" />
        <div className="bottom-sheet__header">
          <h2 id={titleId}>{title}</h2>
          <button
            className="bottom-sheet__close"
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={`Tutup ${title}`}
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
        <div className="bottom-sheet__content">{children}</div>
      </section>
    </div>
  );
};

export default BottomSheet;
