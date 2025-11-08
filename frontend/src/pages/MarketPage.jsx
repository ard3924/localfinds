import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingCart, User, Loader2, XCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import axiosInstance from '../axiosintreceptor.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useCart } from '../components/CartContext.jsx';

const categories = [ // Added 'All' for resetting the filter
  'All', 'Electronics', 'Home & Garden', 'Clothing & Accessories', 'Books',
  'Sports & Outdoors', 'Toys & Games', 'Antiques', 'Other'
];

// --- Sub-Components (SearchBar, CategoryNav, ProductCard, ProductSection) ---

// SearchBar Component
const SearchBar = ({ searchTerm, onSearchChange }) => (
  <div className="my-8">
    <div className="relative">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search for items or sellers"
        className="w-full py-3 pl-12 pr-4 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 shadow-inner"
      />
    </div>
  </div>
);

// CategoryNav Component
const CategoryNav = ({ selectedCategory, onCategoryChange }) => (
  <section className="my-8">
    <h2 className="text-xl font-semibold mb-4 text-gray-800">Categories</h2>
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`
            px-4 py-2 text-sm font-medium rounded-full transition duration-150 ease-in-out
            ${selectedCategory === category
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
          `}
        >
          {category}
        </button>
      ))}
    </div>
  </section>
);

// PriceFilter Component
const PriceFilter = ({ minPrice, onMinChange, maxPrice, onMaxChange }) => (
  <div className="flex-1">
    <h3 className="text-lg font-semibold mb-2 text-gray-700">Price Range</h3>
    <div className="flex items-center gap-2">
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
        <input
          type="number"
          value={minPrice}
          onChange={(e) => onMinChange(e.target.value)}
          placeholder="Min"
          className="w-full py-3 pl-7 pr-4 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 shadow-inner"
        />
      </div>
      <span className="text-gray-500 font-semibold">-</span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => onMaxChange(e.target.value)}
          placeholder="Max"
          className="w-full py-3 pl-7 pr-4 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 shadow-inner"
        />
      </div>
    </div>
  </div>
);

// SortOptions Component
const SortOptions = ({ sortBy, onSortChange }) => {
  const sortOptions = {
    recentlyAdded: 'Recently Added',
    priceAsc: 'Price: Low to High',
    priceDesc: 'Price: High to Low',
  };

  return (
    <div className="relative">
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="appearance-none w-full md:w-auto bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-green-500"
      >
        {Object.entries(sortOptions).map(([key, value]) => (
          <option key={key} value={key}>{value}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
};

import ProductCard from '../components/ProductCard.jsx';

// ProductSection Component
const ProductSection = ({ title, products, gridCols, showTwoRows = false, maxItems }) => {
  const displayProducts = maxItems ? products.slice(0, maxItems) : products;

  const splitIndex = 5;
  const firstRow = showTwoRows ? displayProducts.slice(0, splitIndex) : displayProducts;
  const secondRow = showTwoRows ? displayProducts.slice(splitIndex) : [];

  return (
    <section className="my-10">
      <h2 className="text-2xl font-semibold mb-5 text-gray-800">{title}</h2>

      <div className={`grid gap-4 ${gridCols}`}>
        {firstRow.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </div>

      {showTwoRows && secondRow.length > 0 && (
        <div className={`grid gap-4 mt-4 ${gridCols}`}>
          {secondRow.map((product, index) => (
            <ProductCard key={index} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};

// --- Main Page Component ---
const MarketplacePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms delay
  const debouncedMinPrice = useDebounce(minPrice, 500);
  const debouncedMaxPrice = useDebounce(maxPrice, 500);
  const [sortBy, setSortBy] = useState('recentlyAdded');
  const [filteredProducts, setFilteredProducts] = useState([]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('recentlyAdded');
    toast('Filters cleared!', { icon: '🧹' });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error on new fetch
        const response = await axiosInstance.get('/products');
        if (response.data.success) {
          setProducts(response.data.products);
        } else {
          throw new Error('Failed to fetch products');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        toast.error('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    let result = products;

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(product => product.category === selectedCategory);
    }

    // Filter by search term (name and description)
    if (debouncedSearchTerm.trim()) {
      const lowercasedTerm = debouncedSearchTerm.toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(lowercasedTerm) ||
        product.description.toLowerCase().includes(lowercasedTerm)
      );
    }

    // Filter by price range
    const min = parseFloat(debouncedMinPrice);
    const max = parseFloat(debouncedMaxPrice);

    if (!isNaN(min)) {
      result = result.filter(product => product.price >= min);
    }
    if (!isNaN(max)) {
      result = result.filter(product => product.price <= max);
    }

    setFilteredProducts(result);
  }, [products, debouncedSearchTerm, selectedCategory, debouncedMinPrice, debouncedMaxPrice]);

  // Apply sorting to the filtered products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'priceAsc':
        return a.price - b.price;
      case 'priceDesc':
        return b.price - a.price;
      case 'recentlyAdded':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  // The main list of products to display, now sorted
  const displayProducts = sortedProducts;
  // Recommended products can still be derived from the filtered (but not yet sorted) list
  const recommendedProducts = filteredProducts.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              // You might want to re-trigger fetchProducts here
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl pt-20 flex-grow">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-2/3">
            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </div>
          <div className="flex-1 flex md:items-end gap-4 w-full">
            <PriceFilter minPrice={minPrice} onMinChange={setMinPrice} maxPrice={maxPrice} onMaxChange={setMaxPrice} />
            <div className="pt-8">
              <button
                onClick={handleClearFilters}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
                title="Clear all filters"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <CategoryNav selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
          <div className="mt-8">
            <SortOptions sortBy={sortBy} onSortChange={setSortBy} />
          </div>
        </div>

        {loading && products.length === 0 ? null : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              {debouncedSearchTerm || selectedCategory !== 'All' || minPrice || maxPrice
                ? 'No products match your criteria.'
                : 'No products available at the moment.'}
            </p>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <ProductSection
              title="Recommended for You"
              products={recommendedProducts}
              gridCols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              maxItems={5}
            />

            <ProductSection
              title="Recently Added"
              products={displayProducts}
              gridCols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
              showTwoRows={true}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default MarketplacePage;