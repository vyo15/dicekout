import ProductCard from "./ProductCard";

const ProductGrid = ({
  products,
  priorityCount = 0,
  variant = "default",
  mobileScrollable = false,
  mobileCompact = false,
  ariaLabel,
}) => {
  const classNames = [
    "product-grid",
    variant === "catalog" ? "product-grid--catalog" : "",
    mobileScrollable ? "product-grid--mobile-scroll" : "",
    mobileCompact ? "product-grid--mobile-compact" : "",
  ].filter(Boolean).join(" ");

  const cardVariant = mobileCompact && variant === "default"
    ? "home-compact"
    : mobileScrollable && variant === "default"
      ? "home-scroll"
      : variant;

  return (
    <div className={classNames} aria-label={ariaLabel}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < priorityCount}
          variant={cardVariant}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
