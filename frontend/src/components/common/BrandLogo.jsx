import { Link } from "react-router-dom";
import { withBasePath } from "../../config/site";

const BrandLogo = ({ compact = false }) => (
  <Link
    className={`brand-logo${compact ? " brand-logo--compact" : ""}`}
    to="/"
    aria-label="DicekOut.id, kembali ke beranda"
  >
    <span className="brand-logo__mark" aria-hidden="true">
      <img
        className="brand-logo__mark-image brand-logo__mark-image--light"
        src={withBasePath("brand/dicekout-mark-light.png")}
        width="822"
        height="623"
        alt=""
      />
      <img
        className="brand-logo__mark-image brand-logo__mark-image--dark"
        src={withBasePath("brand/dicekout-mark-dark.png")}
        width="822"
        height="623"
        alt=""
      />
    </span>
    <span className="brand-logo__wordmark" aria-hidden="true">DICEKOUT.ID</span>
  </Link>
);

export default BrandLogo;
