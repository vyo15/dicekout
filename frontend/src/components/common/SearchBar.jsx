import { useId, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const SearchBar = ({
  initialValue = "",
  placeholder = "Cari nama produk atau kata dari video...",
  compact = false,
  onSubmit,
}) => {
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate();
  const inputId = useId();

  const handleSubmit = (event) => {
    event.preventDefault();
    const query = value.trim();
    if (onSubmit) {
      onSubmit(query);
      return;
    }
    navigate(query ? `/produk?q=${encodeURIComponent(query)}` : "/produk");
  };

  return (
    <form className={`search-bar${compact ? " search-bar--compact" : ""}`} role="search" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={inputId}>Cari produk</label>
      <FiSearch aria-hidden="true" />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      <button type="submit">Cari</button>
    </form>
  );
};

export default SearchBar;
