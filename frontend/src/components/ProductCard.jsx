import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from './CartContext.jsx';
import axiosInstance from '../axiosintreceptor.js';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const displayPrice = () => {
    if (product.discountPercentage > 0) {
      const originalPrice = product.originalPrice || product.price;
      const discountedPrice = product.price;
      return (
        <div className="flex flex-col">
          <span className="text-sm text-gray-500 line-through">${originalPrice}</span>
          <div className="flex items-center space-x-1">
            <span className="text-lg font-bold text-green-600">${discountedPrice}</span>
            <span className="bg-red-500 text-white px-1 py-0.5 rounded text-xs font-medium">
              {product.discountPercentage}% OFF
            </span>
          </div>
        </div>
      );
    }
    return <p className="text-lg font-bold text-green-600">${product.price}</p>;
  };

  const handleAddToCart = async () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to add items to your cart');
      navigate('/signin');
      return;
    }

    // Check if user is a seller
    try {
      const userResponse = await axiosInstance.get('/user/account');
      if (userResponse.data.role === 'seller') {
        toast.error('Sellers cannot add items to cart. Please sign in as a buyer to purchase products.');
        return;
      }
    } catch (err) {
      console.error('Error checking user role:', err);
      toast.error('Failed to verify user role. Please try again.');
      return;
    }

    try {
      addToCart(product);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error('Failed to add item to cart');
    }
  };

  const isNew = () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return new Date(product.createdAt) > twoDaysAgo;
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden transition duration-300 ease-in-out hover:shadow-xl border border-gray-200 flex flex-col h-full">
      <div className="relative">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="aspect-[4/3] w-full object-cover cursor-pointer"
            onClick={() => window.location.href = `/product/${product._id}`}
          />
        ) : (
          <div className="aspect-[4/3] w-full bg-gray-200 flex items-center justify-center cursor-pointer" onClick={() => window.location.href = `/product/${product._id}`}>
            <span className="text-xl font-bold text-gray-400">No Image</span>
          </div>
        )}
        {isNew() && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            New
          </div>
        )}
        {product.discountPercentage > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            Sale
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-grow">
        <div className="flex-grow">
          <p className="text-sm font-medium text-gray-800 truncate cursor-pointer" onClick={() => window.location.href = `/product/${product._id}`}>{product.name}</p>
          {product.tagline && <p className="text-xs text-gray-600 mb-1">{product.tagline.split(',').map(s => s.trim()).join(' | ')}</p>}
          {displayPrice()}
        </div>
        <button
          onClick={handleAddToCart}
          className="w-full bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors text-sm"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
