import { useId, useMemo, useState } from "react";
import { FiLayers, FiSearch, FiTag } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { getSearchSuggestions } from "../../utils/catalog";

const iconByType = {
  category: FiTag,
  collection: FiLayers,
  product: FiSearch,
};

const SearchAutocomplete = ({
  value,
  onValueChange,
  onSubmit,
  inputRef,
  placeholder,
  formClassName,
  inputId: providedInputId,
  buttonLabel = "Cari",
}) => {
  const generatedId = useId();
  const inputId = providedInputId || generatedId;
  const listId = `${inputId}-suggestions`;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestions = useMemo(() => getSearchSuggestions(value), [value]);

  const selectSuggestion = (suggestion) => {
    setOpen(false);
    setActiveIndex(-1);
    navigate(suggestion.to);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (open && activeIndex >= 0 && suggestions[activeIndex]) {
      selectSuggestion(suggestions[activeIndex]);
      return;
    }
    setOpen(false);
    onSubmit(value.trim());
  };

  const handleKeyDown = (event) => {
    if (!suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const showSuggestions = open && suggestions.length > 0;

  return (
    <div className="search-autocomplete">
      <form className={formClassName} role="search" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor={inputId}>Cari produk</label>
        <FiSearch aria-hidden="true" />
        <input
          id={inputId}
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        />
        <button type="submit">{buttonLabel}</button>
      </form>

      {showSuggestions ? (
        <div className="search-suggestions" id={listId} role="listbox" aria-label="Saran pencarian">
          {suggestions.map((suggestion, index) => {
            const Icon = iconByType[suggestion.type] || FiSearch;
            return (
              <button
                id={`${listId}-${index}`}
                className={`search-suggestion${activeIndex === index ? " search-suggestion--active" : ""}`}
                key={suggestion.id}
                type="button"
                role="option"
                aria-selected={activeIndex === index}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span className="search-suggestion__icon"><Icon aria-hidden="true" /></span>
                <span>
                  <strong>{suggestion.label}</strong>
                  <small>{suggestion.description}</small>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default SearchAutocomplete;
