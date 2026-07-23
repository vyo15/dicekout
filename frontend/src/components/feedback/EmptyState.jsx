import { FiSearch } from "react-icons/fi";

const EmptyState = ({
  title = "Produk belum ditemukan",
  description,
  action,
  icon: Icon = FiSearch,
  className = "",
}) => (
  <div className={`empty-state${className ? ` ${className}` : ""}`} role="status">
    <span className="empty-state__icon" aria-hidden="true"><Icon /></span>
    <h2>{title}</h2>
    <p>{description || "Coba gunakan kata pencarian atau kategori lain."}</p>
    {action}
  </div>
);

export default EmptyState;
