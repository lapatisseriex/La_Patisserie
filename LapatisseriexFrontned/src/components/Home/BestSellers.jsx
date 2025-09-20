import ProductCard from "../Products/ProductCard";
import DessertLoader from "../common/DessertLoader";

// BestSellers.jsx
const BestSellers = ({ products, loading = false }) => {
  if (loading || !products || products.length === 0) {
    return (
      <section className="w-full py-0 md:py-6">
        <div className="max-w-screen-xl mx-auto pt-6 pb-6 md:pt-0 md:pb-0">
          <DessertLoader 
            variant="cupcake" 
            message="Loading our best sellers..."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-0 md:py-6">
      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-6 md:pt-0 md:pb-0">
        <div className="mb-8 space-y-3">
          <h2 className="text-2xl font-bold tracking-wide text-left" style={{ 
            background: 'linear-gradient(135deg, #e0a47d 0%, #c17e5b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0px 0px 1px rgba(224, 164, 125, 0.2)'
          }}>
            Best Sellers
          </h2>
        
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product._id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
