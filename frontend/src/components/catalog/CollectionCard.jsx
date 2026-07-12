import { Link } from "react-router-dom";
import { FiArrowUpRight, FiLayers } from "react-icons/fi";
import { getProductsByCollection } from "../../utils/catalog";
import { withBasePath } from "../../config/site";

const CollectionCard = ({ collection }) => {
  const items = getProductsByCollection(collection.slug);
  const previews = items.slice(0, 3);

  return (
    <Link className="collection-card" to={`/koleksi/${collection.slug}`}>
      <div className="collection-card__preview" aria-hidden="true">
        {previews.map((product, index) => (
          <img
            key={product.id}
            src={withBasePath(product.image)}
            alt=""
            loading="lazy"
            onError={(event) => { event.currentTarget.src = withBasePath("images/products/fallback.svg"); }}
            style={{ "--preview-index": index }}
          />
        ))}
      </div>
      <div className="collection-card__body">
        <span className="collection-card__eyebrow"><FiLayers aria-hidden="true" /> {collection.eyebrow}</span>
        <h3>{collection.name}</h3>
        <p>{collection.description}</p>
        <span className="text-link">Lihat {items.length} produk <FiArrowUpRight aria-hidden="true" /></span>
      </div>
    </Link>
  );
};

export default CollectionCard;
