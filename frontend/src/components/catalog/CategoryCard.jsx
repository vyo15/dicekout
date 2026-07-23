import { Link } from "react-router-dom";
import {
  FiArrowRight,
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

export const CategoryIcon = ({ icon, className = "" }) => {
  const Icon = iconByName[icon] || FiPackage;
  const classes = ["category-card__icon", className].filter(Boolean).join(" ");

  return (
    <span className={classes} aria-hidden="true">
      <Icon />
    </span>
  );
};

const CategoryCard = ({ category, variant = "default" }) => {
  const count = getProductsByCategory(category.slug).length;
  const isCompact = variant === "compact";

  return (
    <Link
      className={`category-card category-card--${category.accent} category-card--${isCompact ? "compact" : "directory"}`}
      to={`/kategori/${category.slug}`}
    >
      <CategoryIcon icon={category.icon} />
      <span className="category-card__content">
        {!isCompact ? <small>{count} produk pilihan</small> : null}
        <strong>{category.name}</strong>
        {isCompact ? <small>{count} produk</small> : <span className="category-card__description">{category.description}</span>}
      </span>
      <span className="category-card__arrow" aria-hidden="true"><FiArrowRight /></span>
    </Link>
  );
};

export default CategoryCard;
