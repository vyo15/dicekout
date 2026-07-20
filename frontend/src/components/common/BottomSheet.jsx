import { useId, useRef } from "react";
import { FiX } from "react-icons/fi";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";

const BottomSheet = ({ open, onClose, title, children, variant = "sheet" }) => {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const titleId = useId();

  useFocusTrap({
    open,
    containerRef: panelRef,
    initialFocusRef: closeButtonRef,
    onEscape: onClose,
    bodyClassName: "bottom-sheet-open",
  });

  if (!open) return null;

  const isResponsiveModal = variant === "responsive-modal";
  const layerClassName = `bottom-sheet-layer${isResponsiveModal ? " bottom-sheet-layer--responsive-modal" : ""}`;
  const panelClassName = `bottom-sheet${isResponsiveModal ? " bottom-sheet--responsive-modal" : ""}`;

  return (
    <div className={layerClassName}>
      <button
        className="bottom-sheet__backdrop"
        type="button"
        onClick={onClose}
        tabIndex={-1}
        aria-hidden="true"
      />
      <section
        className={panelClassName}
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
