import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useCart } from '../components/CartContext.jsx';
import { useWishlist } from '../components/WishlistContext.jsx';
import CustomerReviews from '../components/CustomerReviews.jsx';
import axiosInstance from '../axiosintreceptor.js';
import ProductCard from '../components/ProductCard.jsx';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import toast from 'react-hot-toast';
import { Loader2, Heart, Star, MessageCircle, ChevronLeft, ChevronRight, Flag } from 'lucide-react';

// --- Custom Carousel Components ---

const NextArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div className={`${className} custom-arrow next-arrow`} onClick={onClick}>
      <ChevronRight size={24} />
    </div>
  );
};

const PrevArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div className={`${className} custom-arrow prev-arrow`} onClick={onClick}>
      <ChevronLeft size={24} />
    </div>
  );
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportNote, setReportNote] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const generateAvatarColor = (name) => {
    if (!name) return 'bg-gray-300';
    const colors = [
      'bg-red-200 text-red-800', 'bg-green-200 text-green-800', 'bg-blue-200 text-blue-800',
      'bg-yellow-200 text-yellow-800', 'bg-indigo-200 text-indigo-800', 'bg-purple-200 text-purple-800',
      'bg-pink-200 text-pink-800', 'bg-teal-200 text-teal-800'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
  };

  // Settings for the related products carousel
  const sliderSettings = {
    dots: true,
    infinite: relatedProducts.length > 4, // Only loop if there are more slides than shown
    speed: 500,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    appendDots: dots => (
      <div style={{ bottom: "-40px" }}>
        <ul style={{ margin: "0px" }}> {dots} </ul>
      </div>
    ),
    slidesToShow: 4,
    slidesToScroll: 4,
    initialSlide: 0,
    responsive: [
      {
        breakpoint: 1024, // For tablets
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
        }
      },
      {
        breakpoint: 640, // For mobile
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
        }
      }
    ]
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch product and user data in parallel for efficiency
        const token = localStorage.getItem('token');
        const userPromise = token ? axiosInstance.get('/user/account').catch(() => null) : Promise.resolve(null);
        const [productResponse, userResponse] = await Promise.all([
          axiosInstance.get(`/products/${id}`),
          userPromise
        ]);

        if (productResponse.data.success) {
          const fetchedProduct = productResponse.data.product;
          setProduct(fetchedProduct);
          if (Array.isArray(fetchedProduct.images) && fetchedProduct.images.length > 0) {
            setSelectedImage(fetchedProduct.images[0].url);
          }

          // Fetch related products based on the fetched product's category
          if (fetchedProduct.category) {
            try {
              const relatedResponse = await axiosInstance.get(`/products?category=${fetchedProduct.category}&limit=5`);
              if (relatedResponse.data.success) {
                setRelatedProducts(relatedResponse.data.products.filter(p => p._id !== id).slice(0, 4));
              }
            } catch (relatedError) {
              console.error("Failed to fetch related products:", relatedError);
            }
          }
        } else {
          throw new Error('Failed to fetch product');
        }

        if (userResponse?.data) {
          setCurrentUser(userResponse.data);
        }

      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product. Please try again later.');
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (selectedImage) {
      setIsImageLoading(true);
    }
  }, [selectedImage]);

  const handleAddToCart = () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to add items to your cart.');
      navigate('/signin');
      return;
    }

    if (currentUser && currentUser.role === 'seller') {
      toast.error('Sellers cannot add items to cart. Please sign in as a buyer to purchase products.');
      return;
    }

    try {
      if (product) {
        addToCart(product, quantity);
        toast.success(`${quantity} x ${product.name} added to cart!`);
      }
    } catch (error) {
      toast.error('Failed to add item to cart');
    }
  };

  const handleAddToWishlist = async () => {
    try {
      if (product) {
        await addToWishlist(product);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to add item to wishlist');
      if (error.message === 'Authentication required') navigate('/signin');
    }
  };

  const handleContactSeller = async () => {
    try {
      if (!currentUser) {
        toast.error('Please sign in to contact the seller');
        navigate('/signin');
        return;
      }

      if (currentUser.id === product.seller._id) {
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

  const handleReportProduct = async () => {
    if (!currentUser) {
      toast.error('Please sign in to report products');
      navigate('/signin');
      return;
    }

    if (!reportNote.trim()) {
      toast.error('Please provide a reason for reporting');
      return;
    }

    setIsSubmittingReport(true);
    try {
      const response = await axiosInstance.post('/reports', {
        productId: product._id,
        note: reportNote.trim()
      });

      if (response.data.success) {
        toast.success('Product reported successfully');
        setShowReportModal(false);
        setReportNote('');
      } else {
        toast.error('Failed to report product');
      }
    } catch (error) {
      console.error('Error reporting product:', error);
      if (error.response?.status === 401) {
        toast.error('Please sign in to report products');
        navigate('/signin');
      } else {
        toast.error('Failed to report product. Please try again.');
      }
    } finally {
      setIsSubmittingReport(false);
    }
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
                <div className="relative overflow-hidden rounded-lg">
                  {isImageLoading && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
                  )}
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className={`max-h-96 w-full object-contain rounded-lg transition-all duration-300 ease-in-out hover:scale-110 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setIsImageLoading(false)}
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
                        className={`w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-all ${selectedImage === image.url ? 'ring-2 ring-green-500' : 'border border-transparent'}`}
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
            {product.tagline && <p className="text-lg text-gray-600 mb-2">{product.tagline.split(',').map(s => s.trim()).join(' | ')}</p>}
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => ( // Use real data if available
                  <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                ))}
                <a href="#reviews" className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                  ({product.reviewCount || 0} reviews)
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
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${generateAvatarColor(product.seller?.name || 'Unknown Seller')}`}>
                    {(product.seller?.name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{product.seller?.name || 'Unknown Seller'}</p>
                    <p className="text-xs text-gray-500">Active seller</p>
                  </div>
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
              <button
                onClick={() => setShowReportModal(true)}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors flex items-center space-x-1"
              >
                <Flag className="w-4 h-4" />
                <span>Report</span>
              </button>
            </div>

            {/* Contact Seller Button */}
            {currentUser?._id !== product.seller?._id && (
              <button
                onClick={handleContactSeller}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Contact Seller</span>
              </button>
            )}



          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Related Products</h3>
            <Slider {...sliderSettings}>
              {relatedProducts.map(relatedProduct => (
                <div key={relatedProduct._id} className="px-2 pb-4"> {/* Add padding for spacing between cards */}
                  <ProductCard product={relatedProduct} />
                </div>
              ))}
            </Slider>
          </div>
        )}

        {/* Custom styles for the carousel */}
        <style>{`
          .custom-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background-color: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.2s ease-in-out;
          }
          .custom-arrow:hover {
            background-color: white;
            transform: translateY(-50%) scale(1.1);
          }
          .next-arrow { right: -20px; }
          .prev-arrow { left: -20px; }
          .slick-dots li button:before {
            font-size: 10px;
            color: #9ca3af;
          }
          .slick-dots li.slick-active button:before {
            color: #16a34a;
          }
        `}</style>

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Report Product</h3>
              <textarea
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                placeholder="Please describe why you are reporting this product..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
              />
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportProduct}
                  disabled={isSubmittingReport}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
                >
                  {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        )}

        <CustomerReviews productId={id} />
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
