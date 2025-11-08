import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../axiosintreceptor.js';
import { useCart } from './CartContext.jsx';
import NotificationBell from './NotificationBell.jsx';
import { ShoppingCart, Menu, X } from 'lucide-react';

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems } = useCart();

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);

        if (token) {
            // Decode token to get user role
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role);
            } catch (error) {
                setUserRole(null);
            }
        } else {
            setUserRole(null);
        }
    }, [location]); // Re-check login status on route change

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        navigate('/signin');
    };

    return (
        <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="bg-green-500 rounded-full p-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.993.883L4 8v9a1 1 0 001 1h10a1 1 0 001-1V8a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-gray-800">LocalFinds</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link
                            to="/marketplace"
                            className={`font-medium ${location.pathname === '/marketplace' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                        >
                            Marketplace
                        </Link>
                        {isLoggedIn && (
                            <Link
                                to="/chat"
                                className={`font-medium ${location.pathname === '/chat' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                            >
                                Chat
                            </Link>
                        )}
                        <Link
                            to="/help"
                            className={`font-medium ${location.pathname === '/help' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                        >
                            Help
                        </Link>
                        {isLoggedIn && userRole !== 'seller' && (
                            <Link
                                to="/cart"
                                className={`relative font-medium ${location.pathname === '/cart' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                            >
                                <ShoppingCart className="w-6 h-6" />
                                {cartItems.length > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {cartItems.length}
                                    </span>
                                )}
                            </Link>
                        )}
                        {isLoggedIn && <NotificationBell />}
                    </nav>

                    {/* Auth buttons */}
                    <div className="hidden md:flex items-center space-x-4">
                        {isLoggedIn ? (
                            <>
                                {userRole === 'admin' && (
                                    <Link to="/admin" className="text-gray-600 hover:text-green-600 font-medium">
                                        Admin
                                    </Link>
                                )}
                                {userRole === 'seller' && (
                                    <Link to="/seller-dashboard" className="text-gray-600 hover:text-green-600 font-medium">
                                        Dashboard
                                    </Link>
                                )}
                                <Link to="/account" className="text-gray-600 hover:text-green-600 font-medium">
                                    Account
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-300"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/signin" className="text-gray-600 hover:text-green-600 font-medium">
                                    Sign In
                                </Link>
                                <Link to="/signup" className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-300">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-600 hover:text-green-600 focus:outline-none focus:text-green-600"
                        >
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            <Link
                                to="/marketplace"
                                className={`block px-3 py-2 text-base font-medium hover:bg-gray-50 ${location.pathname === '/marketplace' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Marketplace
                            </Link>
                            {isLoggedIn && (
                                <Link
                                    to="/chat"
                                    className={`block px-3 py-2 text-base font-medium hover:bg-gray-50 ${location.pathname === '/chat' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Chat
                                </Link>
                            )}
                            <Link
                                to="/help"
                                className={`block px-3 py-2 text-base font-medium hover:bg-gray-50 ${location.pathname === '/help' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Help
                            </Link>
                            {isLoggedIn && userRole !== 'seller' && (
                                <Link
                                    to="/cart"
                                    className={`flex items-center px-3 py-2 text-base font-medium hover:bg-gray-50 ${location.pathname === '/cart' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <ShoppingCart className="w-5 h-5 mr-2" />
                                    Cart
                                    {cartItems.length > 0 && (
                                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                            {cartItems.length}
                                        </span>
                                    )}
                                </Link>
                            )}
                        </div>
                        <div className="pt-4 pb-3 border-t border-gray-200">
                            <div className="px-2 space-y-1">
                                {isLoggedIn ? (
                                    <>
                                        {userRole === 'admin' && (
                                            <Link
                                                to="/admin"
                                                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-green-600 hover:bg-gray-50"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Admin
                                            </Link>
                                        )}
                                        {userRole === 'seller' && (
                                            <Link
                                                to="/seller-dashboard"
                                                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-green-600 hover:bg-gray-50"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Dashboard
                                            </Link>
                                        )}
                                        <Link
                                            to="/account"
                                            className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-green-600 hover:bg-gray-50"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            Account
                                        </Link>
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-green-600 hover:bg-gray-50"
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/signin"
                                            className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-green-600 hover:bg-gray-50"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            to="/signup"
                                            className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-green-600 hover:bg-gray-50"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            Sign Up
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;