import { Link } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";

const SectionHeader = ({ eyebrow, title, description, linkTo, linkLabel = "Lihat semua" }) => (
  <div className="section-header">
    <div>
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
    {linkTo ? (
      <Link className="text-link" to={linkTo}>
        {linkLabel} <FiArrowUpRight aria-hidden="true" />
      </Link>
    ) : null}
  </div>
);

export default SectionHeader;
