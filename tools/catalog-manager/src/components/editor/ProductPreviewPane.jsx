import { FiLink, FiMonitor, FiMoon, FiSmartphone, FiSun, FiTablet } from "react-icons/fi";

export const ProductPreviewPane = ({
  product,
  options,
  previewMode,
  previewTheme,
  previewClass,
  previewImage,
  imageFailed,
  activeAffiliateLinks,
  issues,
  errorCount,
  categoryName,
  onPreviewModeChange,
  onPreviewThemeToggle,
  onImageError,
}) => (
  <aside className="preview-pane">
    <div className="preview-pane__heading">
      <div><span className="eyebrow">Live preview</span><h2>Halaman produk</h2></div>
      <div className="preview-controls">
        <div className="preview-device-switch" role="group" aria-label="Ukuran preview">
          <button className={previewMode === "mobile" ? "active" : ""} onClick={() => onPreviewModeChange("mobile")} aria-label="Preview mobile"><FiSmartphone aria-hidden="true" /></button>
          <button className={previewMode === "tablet" ? "active" : ""} onClick={() => onPreviewModeChange("tablet")} aria-label="Preview tablet"><FiTablet aria-hidden="true" /></button>
          <button className={previewMode === "desktop" ? "active" : ""} onClick={() => onPreviewModeChange("desktop")} aria-label="Preview desktop"><FiMonitor aria-hidden="true" /></button>
        </div>
        <button
          className="preview-theme-toggle"
          type="button"
          onClick={onPreviewThemeToggle}
          aria-label={previewTheme === "dark" ? "Preview tema terang" : "Preview tema gelap"}
        >
          {previewTheme === "dark" ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
        </button>
      </div>
    </div>

    <div className={`detail-preview detail-preview--${previewMode} detail-preview--theme-${previewTheme}`}>
      <div className={previewClass}>
        {previewImage && !imageFailed ? <img src={previewImage} alt="" onError={onImageError} /> : <span>Gambar produk</span>}
      </div>
      <div className="detail-preview__body">
        <small>{categoryName(product.categorySlug)}</small>
        <h3>{product.name || "Nama produk"}</h3>
        <p>{product.summary || "Ringkasan produk akan tampil di sini."}</p>
        {product.demo && <span className="demo-badge">Produk demo</span>}
        <div className="preview-reason">
          <strong>Kenapa direkomendasikan?</strong>
          <p>{product.recommendationReason || "Alasan rekomendasi akan tampil di sini."}</p>
        </div>
        {activeAffiliateLinks.length > 0 && (
          <div className="preview-cta-list">
            {activeAffiliateLinks.map((link, index) => (
              <span key={`${link.marketplace}-${index}`} className={link.isPrimary ? "primary" : ""}>
                <FiLink aria-hidden="true" />
                {link.label || options.marketplaces.find((item) => item.id === link.marketplace)?.defaultCta || "Cek marketplace"}
              </span>
            ))}
          </div>
        )}
        <small className="preview-disclosure">Tautan marketplace dapat berupa link affiliate. Harga dan ketersediaan mengikuti marketplace.</small>
        {product.pros.length > 0 && <div className="preview-list"><strong>Kelebihan</strong><ul>{product.pros.map((item) => <li key={item}>{item}</li>)}</ul></div>}
        {product.considerations.length > 0 && <div className="preview-list"><strong>Perlu diperhatikan</strong><ul>{product.considerations.map((item) => <li key={item}>{item}</li>)}</ul></div>}
        {product.contentReferences.length > 0 && (
          <div className="preview-content-links">
            <strong>Lihat konten terkait</strong>
            {product.contentReferences.map((item, index) => <span key={`${item.platform}-${index}`}>{item.label || item.platform}</span>)}
          </div>
        )}
      </div>
    </div>

    {issues && (
      <div className={`issues ${errorCount ? "issues--error" : "issues--ok"}`}>
        <div className="issues__heading">
          <strong>{errorCount ? `${errorCount} error` : "Validasi lolos"}</strong>
          {issues.warnings.length > 0 && <span>{issues.warnings.length} warning</span>}
        </div>
        {issues.errors.map((item, index) => <p key={`error-${index}`}>{item}</p>)}
        {issues.warnings.map((item, index) => <p key={`warning-${index}`}>{item}</p>)}
      </div>
    )}
    <div className="local-note"><strong>Hanya lokal</strong><p>Panel tidak melakukan commit, push, atau deploy otomatis.</p></div>
  </aside>
);
