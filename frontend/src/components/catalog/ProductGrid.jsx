import ProductCard from "./ProductCard";

const ProductGrid = ({ products, priorityCount = 0, variant = "default" }) => {
  const className = variant === "catalog" ? "product-grid product-grid--catalog" : "product-grid";

  return (
    <div className={className}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < priorityCount}
          variant={variant}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
