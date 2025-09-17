import ProductCard from "../Products/ProductCard";
// BestSellers.jsx
const BestSellers = ({ products }) => {
  return (
    <section className="w-full py-6 bg-white">
      <h2 className="text-xl font-bold text-black uppercase tracking-wide mb-4 text-center">
        Best Sellers
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-screen-xl mx-auto px-4">
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
};
export default BestSellers;
