import { FiTrash2 } from "react-icons/fi";
import { Field, Modal } from "./ManagerPrimitives.jsx";

import { canConfirmProductDelete } from "./deleteDialogState.js";

export function DeleteProductDialog({
  dialog,
  busy,
  onClose,
  onConfirm,
  onTypedNameChange,
  onConfirmedChange,
  productImageUrl,
}) {
  if (!dialog) return null;
  const isDraft = dialog.kind === "draft";
  const canConfirm = canConfirmProductDelete(dialog);

  return (
    <Modal
      title={isDraft ? `Hapus draft “${dialog.item.name}”?` : "Hapus produk secara permanen"}
      description={isDraft
        ? "Draft dan temporary image eksklusifnya akan dibersihkan."
        : "Server akan memindai dan membersihkan seluruh relasi sebelum menulis source."}
      danger
      onClose={() => { if (!busy) onClose(); }}
    >
      {dialog.loading ? (
        <div className="dialog-loading"><span className="loading__spinner" />Menganalisis seluruh relasi produk…</div>
      ) : isDraft ? (
        <>
          <div className="impact-summary">
            <div><small>Draft</small><strong>{dialog.item.name}</strong></div>
            <div><small>Gambar temporary</small><strong>{dialog.item._draft?.tempMedia ? "Akan dicek pemakaiannya" : "Tidak ada"}</strong></div>
          </div>
          <div className="modal-actions">
            <button className="button" type="button" onClick={onClose} disabled={busy}>Batal</button>
            <button className="button button--danger" type="button" onClick={onConfirm} disabled={busy}>
              <FiTrash2 aria-hidden="true" />Hapus draft
            </button>
          </div>
        </>
      ) : dialog.impact ? (
        <>
          <div className="delete-product-identity">
            <div className={`catalog-thumb palette-${dialog.item.visual?.paletteId || "neutral"}`}>
              {dialog.item.image ? <img src={productImageUrl(dialog.item)} alt="" /> : <span>Gambar</span>}
            </div>
            <div>
              <small>Produk target</small>
              <strong>{dialog.impact.product.name}</strong>
              <span>{dialog.impact.product.slug}</span>
            </div>
          </div>
          <div className="impact-grid">
            <div><small>Relasi koleksi</small><strong>{dialog.impact.collections.length}</strong></div>
            <div><small>Draft terkait</small><strong>{dialog.impact.drafts.length}</strong></div>
            <div><small>Link affiliate</small><strong>{dialog.impact.product.affiliateLinks}</strong></div>
            <div><small>Konten terkait</small><strong>{dialog.impact.product.contentReferences}</strong></div>
          </div>
          <div className="impact-list">
            <strong>Yang akan dilakukan otomatis</strong>
            <ul>
              <li>Hapus satu objek produk dari products.json.</li>
              <li>Hapus ID produk dari seluruh koleksi yang terhubung.</li>
              <li>Hapus draft dan temporary image terkait yang tidak dipakai data lain.</li>
              <li>{dialog.impact.product.imageProtected
                ? "Pertahankan gambar bawaan sistem."
                : dialog.impact.product.imageShared
                  ? `Pertahankan gambar karena masih digunakan ${dialog.impact.product.imageUsers} data lain.`
                  : "Hapus gambar source karena hanya digunakan produk ini."}</li>
              <li>Buat backup lokal dan rollback otomatis jika validasi akhir gagal.</li>
            </ul>
          </div>
          <Field label={`Ketik nama produk: ${dialog.impact.product.name}`}>
            <input
              value={dialog.typedName}
              onChange={(event) => onTypedNameChange(event.target.value)}
              autoComplete="off"
            />
          </Field>
          <label className="danger-confirm">
            <input
              type="checkbox"
              checked={dialog.confirmed}
              onChange={(event) => onConfirmedChange(event.target.checked)}
            />
            <span>Saya memahami bahwa produk dan seluruh relasinya akan dihapus permanen dari source.</span>
          </label>
          <div className="modal-actions">
            <button className="button" type="button" onClick={onClose} disabled={busy}>Batal</button>
            <button className="button button--danger" type="button" onClick={onConfirm} disabled={busy || !canConfirm}>
              <FiTrash2 aria-hidden="true" />Hapus produk
            </button>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
