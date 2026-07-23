import { FiBookmark } from "react-icons/fi";
import { useProductPreferences } from "../../hooks/useProductPreferences";
import {
  announceProductPreference,
  toggleSavedProduct,
} from "../../utils/productPreferences";

const SaveProductButton = ({ product, compact = false }) => {
  const { savedIds } = useProductPreferences();
  const saved = savedIds.includes(product.id);

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const result = toggleSavedProduct(product.id);
    if (!result.success) {
      announceProductPreference({
        message: "Koleksi tidak dapat disimpan di browser ini.",
        tone: "error",
      });
      return;
    }

    announceProductPreference({
      message: result.saved ? "Produk disimpan ke Koleksi." : "Produk dihapus dari Koleksi.",
      undoIds: result.previousIds,
    });
  };

  return (
    <button
      className={`save-product-button${saved ? " save-product-button--active" : ""}${compact ? " save-product-button--compact" : ""}`}
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? `Hapus ${product.name} dari Koleksi` : `Simpan ${product.name} ke Koleksi`}
      title={saved ? "Hapus dari Koleksi" : "Simpan ke Koleksi"}
    >
      <FiBookmark aria-hidden="true" />
      {compact ? null : <span>{saved ? "Tersimpan" : "Simpan"}</span>}
    </button>
  );
};

export default SaveProductButton;
