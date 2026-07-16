import { FiRefreshCw } from "react-icons/fi";
import { backupLabels, formatDateTime } from "../catalogManagerUtils.js";
import { Modal } from "./ManagerPrimitives.jsx";

export function RollbackDialog({ target, busy, onClose, onConfirm }) {
  if (!target) return null;

  return (
    <Modal
      title="Pulihkan backup?"
      description="Kondisi katalog saat ini akan dibackup terlebih dahulu sebelum pemulihan dijalankan."
      onClose={() => { if (!busy) onClose(); }}
    >
      <div className="impact-summary">
        <div><small>Jenis backup</small><strong>{backupLabels[target.operation] || target.operation}</strong></div>
        <div><small>Dibuat</small><strong>{formatDateTime(target.createdAt)}</strong></div>
        {target.product?.name && <div><small>Produk terkait</small><strong>{target.product.name}</strong></div>}
      </div>
      <div className="modal-actions">
        <button className="button" type="button" onClick={onClose} disabled={busy}>Batal</button>
        <button className="button button--dark" type="button" onClick={onConfirm} disabled={busy}>
          <FiRefreshCw aria-hidden="true" />Pulihkan backup
        </button>
      </div>
    </Modal>
  );
}
