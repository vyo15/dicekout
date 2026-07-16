import { lines } from "../../catalogManagerUtils.js";
import { Field, Section } from "../ManagerPrimitives.jsx";

const RECOMMENDATION_FIELDS = [
  ["Kelebihan", "pros"],
  ["Perlu diperhatikan", "considerations"],
  ["Cocok untuk", "suitableFor"],
  ["Tidak cocok untuk", "notSuitableFor"],
];

export function ContentEditorTab({ product, update }) {
  return (
    <>
      <Section title="Isi rekomendasi" description="Gunakan informasi nyata dan hindari klaim harga, stok, rating, atau diskon yang tidak terverifikasi.">
        <div className="form-grid">
          <Field label="Alasan direkomendasikan" required className="span-2">
            <textarea className="textarea-large" value={product.recommendationReason} onChange={(event) => update("recommendationReason", event.target.value)} />
          </Field>
          {RECOMMENDATION_FIELDS.map(([label, key]) => (
            <Field key={key} label={label} hint="Satu poin per baris">
              <textarea value={(product[key] || []).join("\n")} onChange={(event) => update(key, lines(event.target.value))} />
            </Field>
          ))}
        </div>
      </Section>
      <Section title="Pencarian internal">
        <div className="form-grid">
          <Field label="Kata kunci" hint="Satu kata/frasa per baris">
            <textarea value={(product.keywords || []).join("\n")} onChange={(event) => update("keywords", lines(event.target.value))} />
          </Field>
          <Field label="Alias pencarian" hint="Nama alternatif yang mungkin dicari pengunjung">
            <textarea value={(product.aliases || []).join("\n")} onChange={(event) => update("aliases", lines(event.target.value))} />
          </Field>
        </div>
      </Section>
    </>
  );
}
