import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useCart } from '../components/CartContext.jsx';
import { useWishlist } from '../components/WishlistContext.jsx';
import CustomerReviews from '../components/CustomerReviews.jsx';
import axiosInstance from '../axiosintreceptor.js';
import toast from 'react-hot-toast';
import { Loader2, Heart, Star, MessageCircle } from 'lucide-react';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/products/${id}`);
        if (response.data.success) {
          setProduct(response.data.product);
          if (Array.isArray(response.data.product.images) && response.data.product.images.length > 0) {
            setSelectedImage(response.data.product.images[0].url);
          }
        } else {
          throw new Error('Failed to fetch product');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product. Please try again later.');
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (id) { // Only fetch if there is an ID
      fetchProduct();
    }
  }, [id]);

  const handleAddToCart = async () => {
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
      if (product) {
        addToCart(product, quantity);
        toast.success(`${quantity} x ${product.name} added to cart!`);
      }
    } catch (error) {
      if (error.message === 'Authentication required') {
        toast.error('Please sign in to add items to your cart');
        setTimeout(() => {
          navigate('/signin');
        }, 50);
      } else {
        toast.error('Failed to add item to cart');
      }
    }
  };

  const handleAddToWishlist = async () => {
    try {
      if (product) {
        await addToWishlist(product);
      }
    } catch (error) {
      if (error.message === 'Authentication required') {
        toast.error('Please sign in to add items to your wishlist');
        setTimeout(() => {
          navigate('/signin');
        }, 50);
      } else {
        toast.error('Failed to add item to wishlist');
      }
    }
  };

  const handleContactSeller = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please sign in to contact the seller');
        navigate('/signin');
        return;
      }

      // Check if user is trying to contact themselves
      const userResponse = await axiosInstance.get('/user/account');
      if (userResponse.data.id === product.seller._id) {
        toast.error('You cannot contact yourself');
        return;
      }

      // Create or get existing chat
      const chatResponse = await axiosInstance.post('/chats', {
        participantId: product.seller._id
      });

      if (chatResponse.data.success) {
        toast.success('Opening chat with seller...');
        navigate('/chat', { state: { chatId: chatResponse.data.chat._id } });
      } else {
        toast.error('Failed to start chat with seller');
      }
    } catch (error) {
      console.error('Error contacting seller:', error);
      if (error.response?.status === 401) {
        toast.error('Please sign in to contact the seller');
        navigate('/signin');
      } else {
        toast.error('Failed to contact seller. Please try again.');
      }
    }
  };

  const handleQuantityChange = (amount) => {
    setQuantity(prevQuantity => {
      const newQuantity = prevQuantity + amount;
      // Prevent quantity from going below 1 or above stock
      if (newQuantity < 1) return 1;
      if (product && newQuantity > product.stock) return product.stock;
      return newQuantity;
    });
  };

  const stockStatus = () => {
    if (!product || typeof product.stock === 'undefined') {
      return <span className="text-sm font-medium text-gray-500">Availability unknown</span>;
    }
    if (product.stock === 0) {
      return <span className="text-sm font-medium text-red-600">Out of Stock</span>;
    }
    if (product.stock <= 10) {
      return <span className="text-sm font-medium text-yellow-600">Low Stock ({product.stock} left)</span>;
    }
    return <span className="text-sm font-medium text-green-600">In Stock</span>;
  };

  // Dummy data for reviews summary
  const averageRating = 4.5;
  const reviewCount = 23;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading product...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center pt-24">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Go Back
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 flex-grow">
        {/* Breadcrumbs */}
        <div className="text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:underline">Home</Link> / <Link to="/marketplace" className="hover:underline">Marketplace</Link> / <span className="text-gray-700">{product.category}</span>
        </div>

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="bg-orange-50 p-8 rounded-lg flex justify-center items-center">
            {selectedImage ? (
              <div className="space-y-4">
                {/* Main Image */}
                <div className="overflow-hidden rounded-lg">
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="max-h-96 w-full object-contain rounded-lg transition-transform duration-300 ease-in-out hover:scale-110"
                  />
                </div>
                {/* Thumbnail Images */}
                {Array.isArray(product.images) && product.images.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto">
                    {product.images.map((image, index) => (
                      <img
                        key={index}
                        src={image.url}
                        alt={`${product.name} ${index + 1}`}
                        className={`w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${selectedImage === image.url ? 'ring-2 ring-green-500' : ''}`}
                        onClick={() => setSelectedImage(image.url)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-h-96 w-full bg-gray-200 flex items-center justify-center rounded-lg">
                <span className="text-xl font-bold text-gray-400">No Image</span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <h2 className="text-4xl font-bold text-gray-800 mb-2">{product.name}</h2>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.floor(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                ))}
                <a href="#reviews" className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                  ({reviewCount} reviews)
                </a>
              </div>
              <span className="text-gray-400">|</span>
              {stockStatus()}
            </div>

            <div className="mb-6 border-b pb-6">
              <p className="text-gray-600 mb-4">{product.description}</p>
              {product.originalPrice && product.originalPrice > product.price && (
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg text-gray-500 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                    {product.discountPercentage}% OFF
                  </span>
                </div>
              )}
              <div className="text-5xl font-extrabold text-gray-900">${product.price.toFixed(2)}</div>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <img src="https://i.pravatar.cc/40?img=2" alt="Seller Avatar" className="w-10 h-10 rounded-full mr-3" />
                <div className="flex-grow">
                  <p className="font-semibold">{product.seller?.name || 'Unknown Seller'}</p>
                  <p className="text-xs text-gray-500">Active seller</p>
                </div>
                <button onClick={() => navigate('/store/' + product.seller?._id)} className="text-sm text-green-600 font-semibold hover:underline">View Store</button>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center space-x-4 mb-8">
              <p className="text-sm font-medium text-gray-700">Quantity:</p>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="px-3 py-1 text-lg font-semibold text-gray-600 hover:bg-gray-100 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-1 text-lg font-semibold text-gray-800">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="px-3 py-1 text-lg font-semibold text-gray-600 hover:bg-gray-100 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={product && quantity >= product.stock}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleAddToWishlist}
                className={`p-3 border border-gray-300 rounded-lg transition-colors ${product && isInWishlist(product._id) ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:bg-gray-100 hover:text-red-500'}`}
                aria-label="Add to wishlist"
              >
                <Heart className={`w-6 h-6 ${product && isInWishlist(product._id) ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Contact Seller Button */}
            <button
              onClick={handleContactSeller}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Contact Seller</span>
            </button>


          </div>
        </div>

        <CustomerReviews productId={id} />
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;