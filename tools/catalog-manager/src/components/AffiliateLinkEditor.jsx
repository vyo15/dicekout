import { FiExternalLink } from "react-icons/fi";
import {
  getMarketplaceCtaPresets,
  hasUnverifiedCtaClaim,
} from "../../../../frontend/src/config/marketplaces.js";
import { validateAffiliateUrl } from "../../../../frontend/src/utils/urls.js";
import { Field, Section } from "./ManagerPrimitives.jsx";

export function AffiliateLinkEditor({
  links,
  marketplaces,
  onMarketplaceChange,
  onLinkChange,
  onRemove,
  onAdd,
}) {
  return (
    <Section
      title="Link affiliate"
      description="Tempel URL asli dari program affiliate resmi. Sistem tidak mengubah referral code, sub-ID, campaign, UTM, atau query attribution."
    >
      {links.map((link, index) => {
        const ctaPresets = getMarketplaceCtaPresets(link.marketplace);
        const riskyLabel = hasUnverifiedCtaClaim(link.label);
        const hasUrl = Boolean(String(link.url || "").trim());
        const affiliateValidation = hasUrl
          ? validateAffiliateUrl(link.url, link.marketplace)
          : null;
        const affiliateStatusId = `affiliate-url-status-${index}`;
        const urlDescribedBy = affiliateValidation ? affiliateStatusId : undefined;

        return (
          <div className="repeat-card" key={`${link.marketplace}-${index}`}>
            <div className="repeat-card__grid">
              <Field label="Marketplace">
                <select
                  value={link.marketplace}
                  onChange={(event) => onMarketplaceChange(index, event.target.value)}
                >
                  {marketplaces.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </Field>

              <Field
                label="Label tombol"
                hint="Kosongkan untuk memakai label aman otomatis. Custom label tidak boleh membuat klaim promo, harga, atau stok yang belum terverifikasi."
              >
                <input
                  placeholder={ctaPresets[0] || "Lihat harga di marketplace"}
                  value={link.label}
                  onChange={(event) => onLinkChange(index, { label: event.target.value })}
                  aria-describedby={riskyLabel ? `cta-label-warning-${index}` : undefined}
                />
                <div className="cta-preset-list" role="group" aria-label="Preset label tombol">
                  {ctaPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onLinkChange(index, { label: preset })}
                    >
                      {preset}
                    </button>
                  ))}
                  {link.label ? (
                    <button type="button" onClick={() => onLinkChange(index, { label: "" })}>
                      Pakai otomatis
                    </button>
                  ) : null}
                </div>
                {riskyLabel ? (
                  <small className="field-warning" id={`cta-label-warning-${index}`}>
                    Label ini mengandung klaim yang perlu dibuktikan. Gunakan salah satu preset aman bila informasinya tidak realtime.
                  </small>
                ) : null}
              </Field>

              <Field
                label="URL affiliate asli"
                className="span-2"
                hint={!hasUrl ? "Untuk Shopee, gunakan short link atau wrapper resmi yang dibuat dari akun Shopee Affiliate Anda." : undefined}
              >
                <input
                  type="url"
                  inputMode="url"
                  placeholder="https://s.shopee.co.id/token-resmi"
                  value={link.url}
                  onChange={(event) => onLinkChange(index, { url: event.target.value })}
                  aria-describedby={urlDescribedBy}
                  aria-invalid={affiliateValidation ? !affiliateValidation.valid : undefined}
                />
                {affiliateValidation ? (
                  <small
                    className={affiliateValidation.valid ? undefined : "field-warning"}
                    id={affiliateStatusId}
                    role={affiliateValidation.valid ? "status" : "alert"}
                  >
                    {affiliateValidation.message}
                    {affiliateValidation.warning ? ` ${affiliateValidation.warning}` : ""}
                  </small>
                ) : null}
              </Field>

              <Field label="Status link">
                <select
                  value={link.status || "active"}
                  onChange={(event) => onLinkChange(index, { status: event.target.value })}
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </Field>

              <div className="link-controls">
                <label>
                  <input
                    type="radio"
                    name="primaryAffiliate"
                    checked={Boolean(link.isPrimary)}
                    disabled={link.status === "inactive"}
                    onChange={() => onLinkChange(index, { isPrimary: true })}
                  />
                  <span>Link utama</span>
                </label>
                {affiliateValidation?.valid ? (
                  <a
                    href={affiliateValidation.original}
                    target="_blank"
                    rel="noopener sponsored nofollow"
                  >
                    <FiExternalLink aria-hidden="true" /> Periksa link
                  </a>
                ) : null}
              </div>
            </div>

            <button className="text-button text-button--danger" type="button" onClick={() => onRemove(index)}>
              Hapus link
            </button>
          </div>
        );
      })}

      <button className="button" type="button" onClick={onAdd}>＋ Tambah marketplace</button>
    </Section>
  );
}
