import { withBasePath } from "../../config/site";

const BrandMark = ({ className = "", decorative = true }) => (
  <img
    className={className}
    src={withBasePath("brand/dicekout-logo.png")}
    alt={decorative ? "" : "DicekOut.id"}
    aria-hidden={decorative ? "true" : undefined}
  />
);

export default BrandMark;
