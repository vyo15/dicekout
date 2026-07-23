import { useEffect, useRef, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiX } from "react-icons/fi";
import {
  announceProductPreference,
  replaceSavedProductIds,
  subscribeProductPreferenceFeedback,
} from "../../utils/productPreferences";

const AUTO_DISMISS_MS = 3200;

const PreferenceToast = () => {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => subscribeProductPreferenceFeedback((event) => {
    window.clearTimeout(timeoutRef.current);
    setToast({ ...event.detail, id: Date.now() });
    timeoutRef.current = window.setTimeout(() => setToast(null), AUTO_DISMISS_MS);
  }), []);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  const dismiss = () => {
    window.clearTimeout(timeoutRef.current);
    setToast(null);
  };

  const undo = () => {
    if (!toast?.undoIds) return;
    const success = replaceSavedProductIds(toast.undoIds);
    dismiss();
    if (!success) {
      announceProductPreference({
        message: "Perubahan tidak dapat dikembalikan di browser ini.",
        tone: "error",
      });
    }
  };

  if (!toast) return null;

  return (
    <div
      className={`preference-toast${toast.tone === "error" ? " preference-toast--error" : ""}`}
      role={toast.tone === "error" ? "alert" : "status"}
      aria-live={toast.tone === "error" ? "assertive" : "polite"}
    >
      {toast.tone === "error"
        ? <FiAlertCircle aria-hidden="true" />
        : <FiCheckCircle aria-hidden="true" />}
      <span>{toast.message}</span>
      {toast.undoIds ? <button type="button" onClick={undo}>Urungkan</button> : null}
      <button className="preference-toast__close" type="button" onClick={dismiss} aria-label="Tutup pemberitahuan">
        <FiX aria-hidden="true" />
      </button>
    </div>
  );
};

export default PreferenceToast;
