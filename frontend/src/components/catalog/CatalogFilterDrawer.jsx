import { useRef } from "react";
import { FiX } from "react-icons/fi";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";

const CatalogFilterDrawer = ({ open, onClose, children }) => {
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);

  useFocusTrap({
    open,
    containerRef: drawerRef,
    initialFocusRef: closeButtonRef,
    onEscape: onClose,
    bodyClassName: "catalog-filter-open",
  });

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
        tabIndex={-1}
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
