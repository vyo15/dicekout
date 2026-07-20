import { contentPlatforms } from "../../../../../frontend/src/shared/catalogConfig.js";
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
      <Section title="Konten terkait" description="Hubungkan produk dengan video atau posting yang membawa pengunjung ke DicekOut.">
        {product.contentReferences.map((reference, index) => (
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
              <Field label="URL posting" className="span-2">
                <input value={reference.url} onChange={(event) => updateReference(index, { url: event.target.value })} />
              </Field>
              <Field label="Tanggal posting">
                <input type="date" value={reference.publishedAt || ""} onChange={(event) => updateReference(index, { publishedAt: event.target.value })} />
              </Field>
            </div>
            <button className="text-button text-button--danger" type="button" onClick={() => update("contentReferences", product.contentReferences.filter((_, position) => position !== index))}>
              Hapus konten
            </button>
          </div>
        ))}
        <button className="button" type="button" onClick={() => update("contentReferences", [...product.contentReferences, { platform: "instagram", label: "", url: "", publishedAt: "" }])}>
          ＋ Tambah konten
        </button>
      </Section>
    </>
  );
}
