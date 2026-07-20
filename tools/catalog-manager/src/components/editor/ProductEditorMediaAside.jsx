import { FiImage, FiUploadCloud } from "react-icons/fi";
import { Field, FieldGroup, Section } from "../ManagerPrimitives.jsx";
import { formatBytes } from "../../catalogManagerUtils.js";

export const ProductEditorMediaAside = ({
  product,
  catalog,
  busy,
  previewClass,
  previewImage,
  imageFailed,
  tempMedia,
  publishReady,
  onImageError,
  onUpload,
  onUpdate,
}) => (
  <aside className="editor-aside">
    <Section title="Thumbnail" description="Unggah JPG, PNG, atau WebP. Sistem otomatis mengonversi ke satu file WebP yang efisien.">
      <label className={`upload-card${busy ? " is-disabled" : ""}`}>
        <div className={previewClass}>
          {previewImage && !imageFailed ? (
            <img src={previewImage} alt={product.imageAlt || "Preview produk"} onError={onImageError} />
          ) : (
            <div className="upload-placeholder">
              <FiUploadCloud aria-hidden="true" />
              <span>Pilih gambar produk</span>
              <small>JPG, PNG, atau WebP · diproses otomatis</small>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/png,image/webp,image/jpeg"
          disabled={busy}
          onChange={(event) => onUpload(event.target.files?.[0])}
        />
      </label>
      {product.image && (
        <div className="media-meta">
          <span>{product.imageWidth || "?"} × {product.imageHeight || "?"} px</span>
          <span>{tempMedia ? "WebP temporary" : "Source"}</span>
        </div>
      )}
      {tempMedia?.optimized && (
        <div className="optimization-summary">
          <div>
            <small>Asli</small>
            <strong>{formatBytes(tempMedia.original?.size)}</strong>
            <span>{tempMedia.original?.width} × {tempMedia.original?.height} · {tempMedia.original?.format}</span>
          </div>
          <FiImage aria-hidden="true" />
          <div>
            <small>Hasil</small>
            <strong>{formatBytes(tempMedia.optimized.size)}</strong>
            <span>{tempMedia.optimized.width} × {tempMedia.optimized.height} · WebP</span>
          </div>
          <b>Hemat {tempMedia.optimized.savedPercent}%</b>
        </div>
      )}
    </Section>

    <Section title="Status">
      <Field label="Status publikasi">
        <select value={product.status} onChange={(event) => onUpdate("status", event.target.value)}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </Field>
      <div className="status-summary">
        <span className={`status-dot status-dot--${product.status}`} />
        <div>
          <strong>{product.status === "published" ? (publishReady ? "Siap dipublikasikan" : "Belum siap dipublikasikan") : "Belum dipublikasikan"}</strong>
          <small>{product.status === "published" ? (publishReady ? "Jalankan validasi sebelum menerapkan ke source." : "Lengkapi checklist di tab Publikasi.") : "Aman untuk dilanjutkan nanti."}</small>
        </div>
      </div>
    </Section>

    <Section title="Detail produk">
      <Field label="Kategori" required>
        <select value={product.categorySlug} onChange={(event) => onUpdate("categorySlug", event.target.value)}>
          {catalog.categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
        </select>
      </Field>
      <FieldGroup label="Koleksi">
        <div className="checkbox-list">
          {catalog.collections.map((item) => (
            <label key={item.id}>
              <input
                type="checkbox"
                checked={product.collectionSlugs.includes(item.slug)}
                onChange={(event) => onUpdate(
                  "collectionSlugs",
                  event.target.checked
                    ? [...product.collectionSlugs, item.slug]
                    : product.collectionSlugs.filter((slug) => slug !== item.slug),
                )}
              />
              <span>{item.name}</span>
            </label>
          ))}
        </div>
      </FieldGroup>
    </Section>
  </aside>
);
