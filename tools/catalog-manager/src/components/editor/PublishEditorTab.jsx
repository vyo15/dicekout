import { FiCheckCircle } from "react-icons/fi";
import { Field, Section } from "../ManagerPrimitives.jsx";

export function PublishEditorTab({
  product,
  update,
  completion,
  readinessChecks,
  activeAffiliateLinks,
  errorCount,
  validate,
  busy,
}) {
  return (
    <>
      <Section title="Pengaturan publikasi" description="Produk published wajib memenuhi seluruh validasi live sebelum dapat diterapkan.">
        <div className="form-grid">
          <Field label="Status">
            <select value={product.status} onChange={(event) => update("status", event.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
          <Field label="Tanggal ditinjau">
            <input type="date" value={product.reviewedAt} onChange={(event) => update("reviewedAt", event.target.value)} />
          </Field>
          <Field label="Urutan">
            <input type="number" value={product.sortOrder} onChange={(event) => update("sortOrder", Number(event.target.value))} />
          </Field>
          <div className="toggle-group">
            <label><input type="checkbox" checked={product.demo} onChange={(event) => update("demo", event.target.checked)} /><span>Produk contoh/demo</span></label>
            <label><input type="checkbox" checked={product.featured} onChange={(event) => update("featured", event.target.checked)} /><span>Produk unggulan</span></label>
            <label><input type="checkbox" checked={product.newest} onChange={(event) => update("newest", event.target.checked)} /><span>Tandai sebagai terbaru</span></label>
          </div>
        </div>
      </Section>
      <Section title="Pemeriksaan akhir" description="Checklist ini membantu mencegah produk setengah jadi diterapkan ke katalog.">
        <div className="review-summary">
          <div><strong>{completion}/{readinessChecks.length}</strong><span>Kesiapan produk</span></div>
          <div><strong>{activeAffiliateLinks.length}</strong><span>Link aktif</span></div>
          <div><strong>{product.contentReferences.length}</strong><span>Konten terkait</span></div>
          <div><strong>{errorCount}</strong><span>Error validasi</span></div>
        </div>
        <div className="readiness-checklist">
          {readinessChecks.map(([label, ready]) => (
            <div key={label} className={ready ? "ready" : "missing"}>
              <FiCheckCircle aria-hidden="true" /><span>{label}</span><strong>{ready ? "Siap" : "Belum"}</strong>
            </div>
          ))}
        </div>
        <button className="button button--dark" type="button" onClick={validate} disabled={busy}>Jalankan validasi lengkap</button>
      </Section>
    </>
  );
}
