import { FiArrowLeft } from "react-icons/fi";
import { ContentEditorTab } from "./ContentEditorTab.jsx";
import { EditorTabs } from "./EditorTabs.jsx";
import { GeneralEditorTab } from "./GeneralEditorTab.jsx";
import { LinksEditorTab } from "./LinksEditorTab.jsx";
import { ProductEditorMediaAside } from "./ProductEditorMediaAside.jsx";
import { ProductPreviewPane } from "./ProductPreviewPane.jsx";
import { PublishEditorTab } from "./PublishEditorTab.jsx";

export const ProductEditorView = ({
  product,
  catalog,
  options,
  mode,
  busy,
  activeTab,
  tempMedia,
  previewMode,
  previewTheme,
  previewClass,
  previewImage,
  imageFailed,
  issues,
  errorCount,
  activeAffiliateLinks,
  readinessChecks,
  completion,
  publishReady,
  applyDisabled,
  categoryName,
  onCancel,
  onSaveDraft,
  onValidate,
  onApply,
  onUpload,
  onUpdate,
  onUpdateName,
  onUpdateVisual,
  onActiveTabChange,
  onPreviewModeChange,
  onPreviewThemeToggle,
  onImageError,
  onChangeAffiliateMarketplace,
  onUpdateAffiliateLink,
  onRemoveAffiliateLink,
}) => (
  <>
    <button className="editor-back" type="button" onClick={onCancel} disabled={busy}>
      <FiArrowLeft aria-hidden="true" /><span>Kembali ke daftar produk</span>
    </button>
    <header className="topbar">
      <div>
        <span className="eyebrow">Katalog / {mode === "new" ? "Produk baru" : mode === "draft" ? "Edit draft" : "Edit produk"}</span>
        <h1>{mode === "new" ? "Tambah produk baru" : product.name || "Edit produk"}</h1>
        <p>Isi informasi produk, review preview hasil akhir, lalu terapkan ke source ketika sudah siap.</p>
      </div>
      <div className="topbar__actions">
        <button className="button" onClick={onCancel} disabled={busy}>Batal</button>
        <button className="button" onClick={onSaveDraft} disabled={busy}>Simpan draft</button>
        <button className="button button--dark" onClick={onValidate} disabled={busy}>Validasi</button>
        <button
          className="button button--accent"
          onClick={onApply}
          disabled={applyDisabled}
          title={product.status === "published" && !publishReady ? "Lengkapi seluruh checklist publikasi terlebih dahulu." : undefined}
        >
          Terapkan ke source
        </button>
      </div>
    </header>

    <div className="editor-layout">
      <ProductEditorMediaAside
        product={product}
        catalog={catalog}
        busy={busy}
        previewClass={previewClass}
        previewImage={previewImage}
        imageFailed={imageFailed}
        tempMedia={tempMedia}
        publishReady={publishReady}
        onImageError={onImageError}
        onUpload={onUpload}
        onUpdate={onUpdate}
      />

      <section className="editor-content">
        <EditorTabs activeTab={activeTab} onChange={onActiveTabChange} />
        <div id={`editor-panel-${activeTab}`} className="editor-tab-panel" role="tabpanel" aria-labelledby={`editor-tab-${activeTab}`} tabIndex={0}>
          {activeTab === "general" && (
            <GeneralEditorTab product={product} options={options} update={onUpdate} updateName={onUpdateName} updateVisual={onUpdateVisual} />
          )}
          {activeTab === "content" && <ContentEditorTab product={product} update={onUpdate} />}
          {activeTab === "links" && (
            <LinksEditorTab
              product={product}
              options={options}
              update={onUpdate}
              changeAffiliateMarketplace={onChangeAffiliateMarketplace}
              updateAffiliateLink={onUpdateAffiliateLink}
              removeAffiliateLink={onRemoveAffiliateLink}
            />
          )}
          {activeTab === "publish" && (
            <PublishEditorTab
              product={product}
              update={onUpdate}
              completion={completion}
              readinessChecks={readinessChecks}
              activeAffiliateLinks={activeAffiliateLinks}
              errorCount={errorCount}
              validate={onValidate}
              busy={busy}
              publishReady={publishReady}
            />
          )}
        </div>
      </section>

      <ProductPreviewPane
        product={product}
        options={options}
        previewMode={previewMode}
        previewTheme={previewTheme}
        previewClass={previewClass}
        previewImage={previewImage}
        imageFailed={imageFailed}
        activeAffiliateLinks={activeAffiliateLinks}
        issues={issues}
        errorCount={errorCount}
        categoryName={categoryName}
        onPreviewModeChange={onPreviewModeChange}
        onPreviewThemeToggle={onPreviewThemeToggle}
        onImageError={onImageError}
      />
    </div>
  </>
);
