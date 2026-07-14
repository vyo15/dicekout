import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { getCategory, getCollection } from "../../utils/catalog";

const getRelationReason = (source, candidate) => {
  const sharedCollection = (source.collectionSlugs || []).find((slug) =>
    (candidate.collectionSlugs || []).includes(slug));
  if (sharedCollection) {
    const collection = getCollection(sharedCollection);
    return collection ? `Sama-sama cocok untuk ${collection.name.toLowerCase()}.` : "Memenuhi kebutuhan yang serupa.";
  }
  if (source.categorySlug === candidate.categorySlug) {
    const category = getCategory(source.categorySlug);
    return `Alternatif lain dari kategori ${category?.name || "yang sama"}.`;
  }
  return "Rekomendasi lain yang relevan untuk dilihat.";
};

const RelatedProductSection = ({ product, products = [] }) => {
  if (!products.length) return null;
  const category = getCategory(product.categorySlug);

  return (
    <section className="section section--aqua related-product-section">
      <div className="container">
        <div className="inline-heading">
          <div>
            <span className="eyebrow">Produk terkait</span>
            <h2>Pilihan lain yang masih relevan</h2>
          </div>
          <Link className="text-link" to={`/kategori/${product.categorySlug}`}>Lihat kategori {category?.name}</Link>
        </div>
        <div className="related-product-grid">
          {products.map((candidate) => (
            <div className="related-product-item" key={candidate.id}>
              <p className="related-product-item__reason">{getRelationReason(product, candidate)}</p>
              <ProductCard product={candidate} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedProductSection;
