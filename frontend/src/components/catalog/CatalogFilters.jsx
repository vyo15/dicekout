const CatalogFilters = ({
  categories,
  categoryCounts,
  collections,
  collectionCounts,
  selectedCategory,
  selectedCollection,
  featuredOnly,
  newestOnly,
  featuredCount,
  newestCount,
  idPrefix,
  onCategoryChange,
  onCollectionChange,
  onFeaturedChange,
  onNewestChange,
  onReset,
  showHeader = true,
}) => (
  <div className="catalog-filter-panel">
    {showHeader ? (
      <div className="catalog-filter-panel__header">
        <strong>Filter Produk</strong>
        <button className="catalog-filter-panel__reset" type="button" onClick={onReset}>
          Reset
        </button>
      </div>
    ) : null}

    <fieldset className="catalog-filter-group">
      <legend>Kategori</legend>
      <div className="catalog-filter-list">
        <label className="catalog-filter-option">
          <input
            type="radio"
            name={`${idPrefix}-category`}
            value="all"
            checked={selectedCategory === "all"}
            onChange={() => onCategoryChange("all")}
          />
          <strong>Semua kategori</strong>
          <small>{categoryCounts.all || 0}</small>
        </label>

        {categories.map((category) => (
          <label className="catalog-filter-option" key={category.id}>
            <input
              type="radio"
              name={`${idPrefix}-category`}
              value={category.slug}
              checked={selectedCategory === category.slug}
              onChange={() => onCategoryChange(category.slug)}
            />
            <span>{category.name}</span>
            <small>{categoryCounts[category.slug] || 0}</small>
          </label>
        ))}
      </div>
    </fieldset>

    <fieldset className="catalog-filter-group">
      <legend>Kebutuhan</legend>
      <div className="catalog-filter-list">
        <label className="catalog-filter-option">
          <input
            type="radio"
            name={`${idPrefix}-collection`}
            value="all"
            checked={selectedCollection === "all"}
            onChange={() => onCollectionChange("all")}
          />
          <strong>Semua kebutuhan</strong>
          <small>{collectionCounts.all || 0}</small>
        </label>

        {collections.map((collection) => (
          <label className="catalog-filter-option" key={collection.id}>
            <input
              type="radio"
              name={`${idPrefix}-collection`}
              value={collection.slug}
              checked={selectedCollection === collection.slug}
              onChange={() => onCollectionChange(collection.slug)}
            />
            <span>{collection.name}</span>
            <small>{collectionCounts[collection.slug] || 0}</small>
          </label>
        ))}
      </div>
    </fieldset>

    <fieldset className="catalog-filter-group">
      <legend>Tipe rekomendasi</legend>
      <div className="catalog-filter-list">
        <label className="catalog-filter-option">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={(event) => onFeaturedChange(event.target.checked)}
          />
          <span>Pilihan DicekOut</span>
          <small>{featuredCount}</small>
        </label>

        <label className="catalog-filter-option">
          <input
            type="checkbox"
            checked={newestOnly}
            onChange={(event) => onNewestChange(event.target.checked)}
          />
          <span>Terbaru dibahas</span>
          <small>{newestCount}</small>
        </label>
      </div>

      <p className="catalog-filter-note">
        Harga, rating, promo, dan stok tidak dijadikan filter karena datanya belum tersedia secara terverifikasi.
      </p>
    </fieldset>
  </div>
);

export default CatalogFilters;
