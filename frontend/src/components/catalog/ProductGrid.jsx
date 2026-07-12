import ProductCard from "./ProductCard";

const ProductGrid = ({ products, priorityCount = 0 }) => (
  <div className="product-grid">
    {products.map((product, index) => (
      <ProductCard key={product.id} product={product} priority={index < priorityCount} />
    ))}
  </div>
);

export default ProductGrid;
