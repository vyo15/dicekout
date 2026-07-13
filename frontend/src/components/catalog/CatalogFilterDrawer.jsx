import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";

const getFocusableElements = (container) => Array.from(container.querySelectorAll(
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
));

const CatalogFilterDrawer = ({ open, onClose, children }) => {
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    document.body.classList.add("catalog-filter-open");
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = getFocusableElements(drawerRef.current);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

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
      document.body.classList.remove("catalog-filter-open");
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="catalog-filter-drawer-layer">
      <button
        className="catalog-filter-drawer__backdrop"
        type="button"
        onClick={onClose}
        aria-label="Tutup filter produk"
      />
      <aside
        className="catalog-filter-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-filter-drawer-title"
      >
        <div className="catalog-filter-drawer__header">
          <strong id="catalog-filter-drawer-title">Filter Produk</strong>
          <button
            className="catalog-filter-drawer__close"
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup filter"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
        <div className="catalog-filter-drawer__content">{children}</div>
      </aside>
    </div>
  );
};

export default CatalogFilterDrawer;
