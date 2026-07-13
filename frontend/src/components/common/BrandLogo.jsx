import { Link } from "react-router-dom";
import BrandMark from "./BrandMark";

const BrandLogo = ({ compact = false }) => (
  <Link
    className={`brand-logo${compact ? " brand-logo--compact" : ""}`}
    to="/"
    aria-label="DicekOut.id, kembali ke beranda"
  >
    <BrandMark className="brand-logo__image" />
    <span className="brand-logo__wordmark" aria-hidden="true">DICEKOUT.ID</span>
  </Link>
);

export default BrandLogo;
