import { Link } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";

const Breadcrumbs = ({ items }) => (
  <nav className="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`}>
          {index > 0 ? <FiChevronRight aria-hidden="true" /> : null}
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </li>
      ))}
    </ol>
  </nav>
);

export default Breadcrumbs;
