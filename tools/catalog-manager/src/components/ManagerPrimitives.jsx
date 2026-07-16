import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
} from "react";
import {
  FiCopy,
  FiEdit3,
  FiExternalLink,
  FiMoreHorizontal,
  FiTrash2,
  FiX,
} from "react-icons/fi";

const FORM_CONTROL_TYPES = new Set(["input", "select", "textarea"]);

export function Section({ title, description, children, className = "" }) {
  return (
    <section className={`editor-card ${className}`}>
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Field({ label, hint, required = false, children, className = "" }) {
  const generatedId = useId();
  const hintId = hint ? `${generatedId}-hint` : undefined;
  const childItems = Children.toArray(children);
  const controlIndex = childItems.findIndex(
    (child) => isValidElement(child) && FORM_CONTROL_TYPES.has(child.type),
  );
  const control = controlIndex >= 0 ? childItems[controlIndex] : null;
  const controlId = control?.props.id || `${generatedId}-control`;

  if (control) {
    const describedBy = [control.props["aria-describedby"], hintId]
      .filter(Boolean)
      .join(" ") || undefined;
    childItems[controlIndex] = cloneElement(control, {
      id: controlId,
      required: control.props.required ?? required,
      "aria-required": required || undefined,
      "aria-describedby": describedBy,
    });
  }

  return (
    <div className={`field ${className}`}>
      {control ? (
        <label className="field__label" htmlFor={controlId}>
          {label}{required && <b aria-hidden="true">*</b>}
        </label>
      ) : (
        <span className="field__label">
          {label}{required && <b aria-hidden="true">*</b>}
        </span>
      )}
      {childItems}
      {hint && <small id={hintId}>{hint}</small>}
    </div>
  );
}

export function FieldGroup({ label, hint, required = false, children, className = "" }) {
  const generatedId = useId();
  const labelId = `${generatedId}-label`;
  const hintId = hint ? `${generatedId}-hint` : undefined;

  return (
    <div
      className={`field field-group ${className}`}
      role="group"
      aria-labelledby={labelId}
      aria-describedby={hintId}
      aria-required={required || undefined}
    >
      <span className="field__label" id={labelId}>
        {label}{required && <b aria-hidden="true">*</b>}
      </span>
      {children}
      {hint && <small id={hintId}>{hint}</small>}
    </div>
  );
}

export function Modal({ title, description, children, onClose, danger = false }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();
  closeRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const focusableSelector = "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])";
    dialog?.querySelector(focusableSelector)?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab" || !dialog) return;
      const items = [...dialog.querySelectorAll(focusableSelector)];
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className={`modal-card ${danger ? "modal-card--danger" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <header className="modal-card__header">
          <div>
            <span className="eyebrow">{danger ? "Tindakan berisiko" : "Konfirmasi"}</span>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Tutup dialog">
            <FiX aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export function ActionMenu({ item, isDraft, onEdit, onDuplicate, onDelete, onOpen }) {
  return (
    <div className="row-actions">
      <button className="table-action" type="button" onClick={onEdit}>
        <FiEdit3 aria-hidden="true" /><span>Edit</span>
      </button>
      <details className="action-menu">
        <summary aria-label={`Aksi lain untuk ${item.name || "produk"}`}>
          <FiMoreHorizontal aria-hidden="true" />
        </summary>
        <div className="action-menu__panel">
          {!isDraft && (
            <button type="button" onClick={onOpen}>
              <FiExternalLink aria-hidden="true" />Buka halaman produk
            </button>
          )}
          <button type="button" onClick={onDuplicate}>
            <FiCopy aria-hidden="true" />Duplikat {isDraft ? "draft" : "produk"}
          </button>
          <button className="danger" type="button" onClick={onDelete}>
            <FiTrash2 aria-hidden="true" />Hapus {isDraft ? "draft" : "produk"}
          </button>
        </div>
      </details>
    </div>
  );
}
