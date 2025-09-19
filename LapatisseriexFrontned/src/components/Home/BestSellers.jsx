import ProductCard from "../Products/ProductCard";
import DessertLoader from "../common/DessertLoader";

// BestSellers.jsx
const BestSellers = ({ products, loading = false }) => {
  if (loading || !products || products.length === 0) {
    return (
      <section className="w-full py-6">
        <DessertLoader 
          variant="cupcake" 
          message="Loading our best sellers..."
        />
      </section>
    );
  }

  return (
    <section className="w-full py-6">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="mb-8 space-y-3">
          <h2 className="text-2xl font-bold text-black tracking-wide text-left">
            Best Sellers
          </h2>
        
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product._id} className="transform hover:scale-105 transition-transform duration-300">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
