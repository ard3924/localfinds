import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import AccountSidebar from '../components/AccountSidebar.jsx';
import { useWishlist } from '../components/WishlistContext.jsx';
import { Heart, ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '../components/CartContext.jsx';
import toast from 'react-hot-toast';
import axiosInstance from '../axiosintreceptor.js';

const WishlistPage = () => {
    const { wishlistItems, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState(null);

    const handleAddToCart = async (product) => {
        // Check if user is a seller
        try {
            const userResponse = await axiosInstance.get('/user/account');
            if (userResponse.data.role === 'seller') {
                toast.error('Sellers cannot add items to cart. Please sign in as a buyer to purchase products.');
                return;
            }
        } catch (err) {
            toast.error('Failed to verify user role. Please try again.');
            return;
        }

        try {
            addToCart(product);
            toast.success(`${product.name} added to cart!`);
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

    const handleRemoveFromWishlist = async (productId) => {
        setLoading(true);
        try {
            await removeFromWishlist(productId);
        } catch (error) {
            console.error('Failed to remove from wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="w-full max-w-7xl mx-auto px-4 py-8 pt-24 flex-grow grid grid-cols-1 lg:grid-cols-4 gap-8">
                <AccountSidebar />
                {/* Main Content Area */}
                <div className="lg:col-span-3 bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">My Wishlist</h2>

                    {wishlistItems.length === 0 ? (
                        <div className="text-center py-12">
                            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-xl text-gray-600 mb-4">Your wishlist is empty</p>
                            <p className="text-gray-500 mb-6">Save items you love for later</p>
                            <Link
                                to="/marketplace"
                                className="bg-green-500 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                            >
                                Browse Products
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {wishlistItems.map((item) => {
                                const product = item.product;
                                return (
                                    <div key={product._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="aspect-square overflow-hidden">
                                            {product.images && product.images.length > 0 ? (
                                                <img
                                                    src={product.images[0].url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                    onClick={() => navigate(`/product/${product._id}`)}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                    <span className="text-gray-400">No Image</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4">
                                            <h3
                                                className="font-semibold text-lg mb-2 cursor-pointer hover:text-green-600 transition-colors line-clamp-2"
                                                onClick={() => navigate(`/product/${product._id}`)}
                                            >
                                                {product.name}
                                            </h3>

                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xl font-bold text-green-600">
                                                    ${product.price}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveFromWishlist(product._id)}
                                                    disabled={loading}
                                                    className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                                    aria-label="Remove from wishlist"
                                                >
                                                    <Heart className="w-5 h-5 fill-current" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => handleAddToCart(product)}
                                                className="w-full bg-green-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                                Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default WishlistPage;
