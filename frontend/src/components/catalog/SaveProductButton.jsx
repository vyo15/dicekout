import { FiBookmark } from "react-icons/fi";
import { useProductPreferences } from "../../hooks/useProductPreferences";
import { toggleSavedProduct } from "../../utils/productPreferences";

const SaveProductButton = ({ product, compact = false }) => {
  const { savedIds } = useProductPreferences();
  const saved = savedIds.includes(product.id);

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleSavedProduct(product.id);
  };

  return (
    <button
      className={`save-product-button${saved ? " save-product-button--active" : ""}${compact ? " save-product-button--compact" : ""}`}
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? `Hapus ${product.name} dari produk tersimpan` : `Simpan ${product.name}`}
      title={saved ? "Hapus dari tersimpan" : "Simpan produk"}
    >
      <FiBookmark aria-hidden="true" />
      {compact ? null : <span>{saved ? "Tersimpan" : "Simpan"}</span>}
    </button>
  );
};

export default SaveProductButton;
