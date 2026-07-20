import { FiRefreshCw, FiX } from "react-icons/fi";

const CatalogResultsHeader = ({ query, resultCount, activeFilters, hasActiveFilters, onRemoveFilter, onReset }) => (
  <div className="products-catalog-result-bar" aria-live="polite">
    <div className="products-catalog-result-copy">
      <h2>{query ? `Hasil untuk “${query}”` : "Produk rekomendasi"}</h2>
      <p><strong>{resultCount} produk</strong> ditemukan</p>
    </div>

    <div className="products-catalog-active-filters" aria-label="Filter aktif">
      {activeFilters.map((filter) => (
        <span className="products-catalog-chip" key={filter.key}>
          {filter.label}
          <button type="button" onClick={() => onRemoveFilter(filter.key)} aria-label={`Hapus filter ${filter.label}`}>
            <FiX aria-hidden="true" />
          </button>
        </span>
      ))}

      {hasActiveFilters ? (
        <button className="products-catalog-reset" type="button" onClick={onReset}>
          <FiRefreshCw aria-hidden="true" /> Reset semua
        </button>
      ) : null}
    </div>
  </div>
);

export default CatalogResultsHeader;
