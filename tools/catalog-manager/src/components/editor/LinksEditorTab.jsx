import { contentPlatforms } from "../../../../../frontend/src/shared/catalogConfig.js";
import { validateContentUrl } from "../../../../../frontend/src/shared/catalogSecurity.js";
import { AffiliateLinkEditor } from "../AffiliateLinkEditor.jsx";
import { Field, Section } from "../ManagerPrimitives.jsx";

export function LinksEditorTab({
  product,
  options,
  update,
  changeAffiliateMarketplace,
  updateAffiliateLink,
  removeAffiliateLink,
}) {
  const updateReference = (index, patch) => update(
    "contentReferences",
    product.contentReferences.map((item, position) => position === index ? { ...item, ...patch } : item),
  );

  return (
    <>
      <AffiliateLinkEditor
        links={product.affiliateLinks}
        marketplaces={options.marketplaces}
        onMarketplaceChange={changeAffiliateMarketplace}
        onLinkChange={updateAffiliateLink}
        onRemove={removeAffiliateLink}
        onAdd={() => update("affiliateLinks", [
          ...product.affiliateLinks,
          { marketplace: "shopee", label: "", url: "", status: "active", isPrimary: product.affiliateLinks.length === 0 },
        ])}
      />
      <Section title="Konten terkait" description="Hubungkan produk dengan video atau posting publik yang benar-benar membahas produk yang sama.">
        <p className="workflow-note">
          <strong>TikTok Affiliate memakai alur content-first.</strong> Tambahkan video/posting TikTok milik Anda yang sudah memiliki product anchor/keranjang kuning dan disclosure komersial aktif. Jangan masukkan URL produk TikTok Shop sebagai direct affiliate link.
        </p>
        {product.contentReferences.map((reference, index) => {
          const hasUrl = Boolean(String(reference.url || "").trim());
          const contentValidation = hasUrl ? validateContentUrl(reference.url, reference.platform) : null;
          const statusId = `content-url-status-${index}`;
          return (
          <div className="repeat-card" key={`${reference.platform}-${index}`}>
            <div className="repeat-card__grid">
              <Field label="Platform">
                <select value={reference.platform} onChange={(event) => updateReference(index, { platform: event.target.value })}>
                  {contentPlatforms.map((platform) => (
                    <option key={platform.id} value={platform.id}>{platform.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Judul konten">
                <input value={reference.label} onChange={(event) => updateReference(index, { label: event.target.value })} />
              </Field>
              <Field
                label="URL posting"
                className="span-2"
                hint={reference.platform === "tiktok" && !hasUrl ? "Gunakan URL video/posting TikTok milik Anda, bukan URL produk TikTok Shop. Pastikan product anchor/keranjang kuning dan disclosure komersial sudah aktif." : undefined}
              >
                <input
                  type="url"
                  inputMode="url"
                  placeholder={reference.platform === "tiktok" ? "https://www.tiktok.com/@akun/video/1234567890" : "https://..."}
                  value={reference.url}
                  onChange={(event) => updateReference(index, { url: event.target.value })}
                  aria-describedby={contentValidation ? statusId : undefined}
                  aria-invalid={contentValidation ? !contentValidation.valid : undefined}
                />
                {contentValidation ? (
                  <small
                    id={statusId}
                    className={contentValidation.valid ? undefined : "field-warning"}
                    role={contentValidation.valid ? "status" : "alert"}
                  >
                    {contentValidation.message}
                    {contentValidation.warning ? ` ${contentValidation.warning}` : ""}
                  </small>
                ) : null}
              </Field>
              <Field label="Tanggal posting">
                <input type="date" value={reference.publishedAt || ""} onChange={(event) => updateReference(index, { publishedAt: event.target.value })} />
              </Field>
            </div>
            <button className="text-button text-button--danger" type="button" onClick={() => update("contentReferences", product.contentReferences.filter((_, position) => position !== index))}>
              Hapus konten
            </button>
          </div>
          );
        })}
        <div className="inline-actions">
          <button className="button" type="button" onClick={() => update("contentReferences", [...product.contentReferences, { platform: "tiktok", label: "Lihat video produk di TikTok", url: "", publishedAt: "" }])}>
            ＋ Tambah konten TikTok affiliate
          </button>
          <button className="button button--secondary" type="button" onClick={() => update("contentReferences", [...product.contentReferences, { platform: "instagram", label: "", url: "", publishedAt: "" }])}>
            ＋ Tambah konten lain
          </button>
        </div>
      </Section>
    </>
  );
}
