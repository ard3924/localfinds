import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useCart } from '../components/CartContext.jsx';
import axiosInstance from '../axiosintreceptor.js';
import toast from 'react-hot-toast';

const CartPage = () => {
    const { cartItems, removeFromCart, getCartTotal, clearCart } = useCart();
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [checkoutData, setCheckoutData] = useState({
        shippingAddress: '',
        pin: '',
        phone: '',
        email: '',
        paymentMethod: 'cash_on_delivery',
        orderNotes: ''
    });
    const [cartItemsWithImages, setCartItemsWithImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const navigate = useNavigate();

    // Fetch user profile and product images for cart items
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await axiosInstance.get('/user/account');
                if (response.data) {
                    setUserProfile(response.data);
                    setCheckoutData(prev => ({
                        ...prev,
                        shippingAddress: response.data.address || '',
                        pin: response.data.pinCode || '',
                        phone: response.data.phone || '',
                        email: response.data.email || ''
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
            }
        };

        const fetchProductImages = async () => {
            if (cartItems.length === 0) {
                setCartItemsWithImages([]);
                setLoading(false);
                return;
            }

            try {
                const itemsWithImages = await Promise.all(
                    cartItems.map(async (item) => {
                        try {
                            const response = await axiosInstance.get(`/products/${item._id}`);
                            if (response.data.success) {
                                return {
                                    ...item,
                                    images: response.data.product.images
                                };
                            }
                            return item;
                        } catch (error) {
                            console.error(`Failed to fetch image for product ${item._id}:`, error);
                            return item;
                        }
                    })
                );
                setCartItemsWithImages(itemsWithImages);
            } catch (error) {
                console.error('Error fetching product images:', error);
                setCartItemsWithImages(cartItems);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
        fetchProductImages();
    }, [cartItems]);

    const handleCheckout = async () => {
        // Check if user is a seller
        try {
            const userResponse = await axiosInstance.get('/user/account');
            if (userResponse.data.role === 'seller') {
                toast.error('Sellers cannot place orders. Please sign in as a buyer to purchase products.');
                return;
            }
        } catch (err) {
            console.error('Error checking user role:', err);
            toast.error('Failed to verify user role. Please try again.');
            return;
        }

        if (!checkoutData.email.trim()) {
            toast.error('Please enter an email address');
            return;
        }

        if (!checkoutData.phone.trim()) {
            toast.error('Please enter a phone number');
            return;
        }

        if (!checkoutData.shippingAddress.trim()) {
            toast.error('Please enter a shipping address');
            return;
        }

        if (!checkoutData.pin.trim()) {
            toast.error('Please enter a PIN code');
            return;
        }

        setIsPlacingOrder(true);

        try {
            const orderData = {
                items: cartItemsWithImages.map(item => ({
                    product: item._id || item.id,
                    quantity: item.quantity
                })),
                shippingAddress: checkoutData.shippingAddress,
                paymentMethod: checkoutData.paymentMethod,
                orderNotes: checkoutData.orderNotes
            };

            const response = await axiosInstance.post('/orders', orderData);

            if (response.data.success) {
                toast.success('Order placed successfully!');
                clearCart();
                setCheckoutData({
                    shippingAddress: '',
                    pin: '',
                    phone: '',
                    email: '',
                    paymentMethod: 'cash_on_delivery',
                    orderNotes: ''
                });
                setShowCheckoutModal(false);
                setIsPlacingOrder(false);
                // Redirect to orders page or show success message
                navigate('/orders');
            } else {
                throw new Error(response.data.message || 'Failed to place order');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to place order. Please try again.';
            toast.error(errorMessage);
            setIsPlacingOrder(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="w-full max-w-4xl mx-auto px-4 py-8 pt-24 flex-grow">
                <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-4">My Cart</h2>
                    {cartItems.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-xl text-gray-600 mb-4">Your cart is empty.</p>
                            <Link to="/marketplace" className="bg-green-500 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-600 transition-colors">
                                Continue Shopping
                            </Link>
                        </div>
                    ) : (
                        <div>
                            <div className="space-y-4 mb-6">
                                {cartItemsWithImages.map(item => (
                                    <div key={item._id} className="flex items-center justify-between border-b pb-4">
                                        <div className="flex items-center">
                                            <img
                                                src={item.images?.[0]?.url || 'https://picsum.photos/80'}
                                                alt={item.name}
                                                className="w-20 h-20 object-cover rounded-lg mr-4 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => navigate(`/product/${item._id}`)}
                                            />
                                            <div>
                                                <h3
                                                    className="font-semibold text-lg cursor-pointer hover:text-green-600 transition-colors"
                                                    onClick={() => navigate(`/product/${item._id}`)}
                                                >
                                                    {item.name}
                                                </h3>
                                                <p className="text-gray-600">Quantity: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <p className="font-semibold text-lg mr-6">${(item.price * item.quantity).toFixed(2)}</p>
                                            <button onClick={() => removeFromCart(item._id)} className="text-red-500 hover:text-red-700 font-semibold">
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center mt-8">
                                <button onClick={clearCart} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300">
                                    Clear Cart
                                </button>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">Total: ${getCartTotal()}</p>
                                    <button
                                        onClick={() => {
                                            setShowCheckoutModal(true);
                                            setCheckoutData(prev => ({
                                                ...prev,
                                                paymentMethod: 'cash_on_delivery',
                                                orderNotes: ''
                                            }));
                                        }}
                                        className="mt-2 w-full bg-green-500 text-white py-3 px-8 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                                    >
                                        Proceed to Checkout
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Checkout Modal */}
            {showCheckoutModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
                        <h3 className="text-2xl font-bold mb-6">Checkout</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={userProfile?.name || ''}
                                    className="w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-500 rounded-lg"
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={checkoutData.email}
                                    onChange={(e) => setCheckoutData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={checkoutData.phone}
                                    onChange={(e) => setCheckoutData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter your phone number"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Shipping Address *
                                </label>
                                <textarea
                                    value={checkoutData.shippingAddress}
                                    onChange={(e) => setCheckoutData(prev => ({ ...prev, shippingAddress: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    rows="3"
                                    placeholder="Enter your full shipping address"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    PIN Code *
                                </label>
                                <input
                                    type="text"
                                    value={checkoutData.pin}
                                    onChange={(e) => setCheckoutData(prev => ({ ...prev, pin: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter PIN code"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method
                                </label>
                                <select
                                    value={checkoutData.paymentMethod}
                                    onChange={(e) => setCheckoutData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="cash_on_delivery">Cash on Delivery</option>
                                    <option value="online_payment">Online Payment</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Order Notes (Optional)
                                </label>
                                <textarea
                                    value={checkoutData.orderNotes}
                                    onChange={(e) => setCheckoutData(prev => ({ ...prev, orderNotes: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    rows="2"
                                    placeholder="Any special instructions..."
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-4">
                            <button
                                onClick={() => setShowCheckoutModal(false)}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCheckout}
                                disabled={isPlacingOrder}
                                className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed"
                            >
                                {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default CartPage;