import { Link } from "react-router-dom";
import { withBasePath } from "../../config/site";

const BrandLogo = ({ compact = false }) => (
  <Link
    className={`brand-logo${compact ? " brand-logo--compact" : ""}`}
    to="/"
    aria-label="DicekOut.id, kembali ke beranda"
  >
    <img
      className="brand-logo__image"
      src={withBasePath("brand/dicekout-logo.png")}
      alt=""
      aria-hidden="true"
    />
    <span className="brand-logo__wordmark" aria-hidden="true">DICEKOUT.ID</span>
  </Link>
);

export default BrandLogo;
