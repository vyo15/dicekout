import { Field, Section } from "../ManagerPrimitives.jsx";

export function GeneralEditorTab({ product, options, update, updateName, updateVisual }) {
  return (
    <>
      <Section title="Informasi utama" description="ID dan slug dibuat otomatis dari nama produk untuk mengurangi kesalahan.">
        <div className="form-grid">
          <Field label="Nama produk" required className="span-2">
            <input value={product.name} onChange={(event) => updateName(event.target.value)} placeholder="Contoh: Lampu Meja LED Minimalis" />
          </Field>
          <Field label="ID stabil" hint="Dibuat otomatis dan dikunci untuk menjaga relasi data.">
            <input value={product.id} readOnly placeholder="Terisi otomatis" />
          </Field>
          <Field label="Slug URL" hint="Dibuat otomatis dan tidak diubah setelah produk diterapkan.">
            <input value={product.slug} readOnly placeholder="Terisi otomatis" />
          </Field>
          <Field label="Ringkasan" required className="span-2">
            <textarea value={product.summary} onChange={(event) => update("summary", event.target.value)} placeholder="Ringkasan singkat yang tampil pada kartu produk." maxLength={180} />
            <span className="counter">{product.summary.length}/180</span>
          </Field>
          <Field label="Deskripsi" required className="span-2">
            <textarea className="textarea-large" value={product.description} onChange={(event) => update("description", event.target.value)} placeholder="Jelaskan fungsi, konteks penggunaan, dan hal penting secara objektif." />
          </Field>
        </div>
      </Section>
      <Section title="Gambar & tampilan" description="Pilih palette dan posisi yang membuat produk tetap jelas pada mobile maupun desktop.">
        <div className="form-grid">
          <Field label="Alt gambar" required className="span-2">
            <input value={product.imageAlt} onChange={(event) => update("imageAlt", event.target.value)} placeholder="Deskripsi singkat gambar untuk aksesibilitas" />
          </Field>
          <Field label="Sumber gambar">
            <input value={product.imageSource} onChange={(event) => update("imageSource", event.target.value)} placeholder="Contoh: Foto milik DicekOut" />
          </Field>
          <Field label="Izin/lisensi">
            <input value={product.imageLicense} onChange={(event) => update("imageLicense", event.target.value)} placeholder="Contoh: owned / licensed" />
          </Field>
          <Field label="Palette">
            <select value={product.visual.paletteId} onChange={(event) => updateVisual("paletteId", event.target.value)}>
              {options.productPalettes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </Field>
          <Field label="Skala gambar">
            <select value={product.visual.imageScale} onChange={(event) => updateVisual("imageScale", event.target.value)}>
              {options.imageScales.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Posisi gambar">
            <select value={product.visual.imagePosition} onChange={(event) => updateVisual("imagePosition", event.target.value)}>
              {options.imagePositions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
        </div>
      </Section>
    </>
  );
}
