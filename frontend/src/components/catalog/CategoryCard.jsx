import { Link } from "react-router-dom";
import {
  FiArrowUpRight,
  FiHome,
  FiMonitor,
  FiPackage,
  FiSmartphone,
  FiStar,
} from "react-icons/fi";
import { getProductsByCategory } from "../../utils/catalog";

const iconByName = {
  devices: FiSmartphone,
  desk: FiMonitor,
  home: FiHome,
  sparkles: FiStar,
};

const CategoryCard = ({ category }) => {
  const Icon = iconByName[category.icon] || FiPackage;
  const count = getProductsByCategory(category.slug).length;

  return (
    <Link className={`category-card category-card--${category.accent}`} to={`/kategori/${category.slug}`}>
      <span className="category-card__icon" aria-hidden="true"><Icon /></span>
      <span className="category-card__content">
        <strong>{category.name}</strong>
        <small>{count} produk</small>
      </span>
      <FiArrowUpRight className="category-card__arrow" aria-hidden="true" />
    </Link>
  );
};

export default CategoryCard;
