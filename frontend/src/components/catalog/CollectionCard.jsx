import { Link } from "react-router-dom";
import { FiArrowRight, FiLayers } from "react-icons/fi";
import { getProductsByCollection } from "../../utils/catalog";
import { withBasePath } from "../../config/site";

const CollectionCard = ({ collection }) => {
  const items = getProductsByCollection(collection.slug);
  const previews = items.slice(0, 3);

  return (
    <Link className="collection-card collection-card--directory" to={`/koleksi/${collection.slug}`}>
      <div className={`collection-card__preview collection-card__preview--${previews.length}`} aria-hidden="true">
        {previews.map((product) => (
          <img
            key={product.id}
            src={withBasePath(product.image)}
            alt=""
            loading="lazy"
            onError={(event) => { event.currentTarget.src = withBasePath("images/products/fallback.svg"); }}
          />
        ))}
        <span className="collection-card__count">{items.length} produk</span>
      </div>
      <div className="collection-card__body">
        <span className="collection-card__eyebrow"><FiLayers aria-hidden="true" /> {collection.eyebrow}</span>
        <h3>{collection.name}</h3>
        <p>{collection.description}</p>
        <span className="collection-card__action">Lihat tema <FiArrowRight aria-hidden="true" /></span>
      </div>
    </Link>
  );
};

export default CollectionCard;
