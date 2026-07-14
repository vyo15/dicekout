import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchAutocomplete from "./SearchAutocomplete";

const SearchBar = ({
  initialValue = "",
  placeholder = "Cari nama produk atau kata dari video...",
  compact = false,
  onSubmit,
}) => {
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate();
  const inputId = useId();

  const handleSubmit = (query) => {
    if (onSubmit) {
      onSubmit(query);
      return;
    }
    navigate(query ? `/produk?q=${encodeURIComponent(query)}` : "/produk");
  };

  return (
    <SearchAutocomplete
      value={value}
      onValueChange={setValue}
      onSubmit={handleSubmit}
      inputId={inputId}
      placeholder={placeholder}
      formClassName={`search-bar${compact ? " search-bar--compact" : ""}`}
    />
  );
};

export default SearchBar;
