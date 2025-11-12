import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../axiosintreceptor.js';
import { useCart } from './CartContext.jsx';
import NotificationBell from './NotificationBell.jsx';
import { ShoppingCart, Menu, X, Store } from 'lucide-react';

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
        <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-md z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="rounded-full p-1.5">
                                <ShoppingCart className="text-[#00FF00]" />
                            </div>
                            <span className="text-xl font-bold text-gray-800">LocalFinds</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
                        <Link
                            to="/marketplace"
                            className={`font-medium ${location.pathname === '/marketplace' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                            aria-current={location.pathname === '/marketplace' ? 'page' : undefined}
                        >
                            Marketplace
                        </Link>
                        {isLoggedIn && (
                            <Link
                                to="/chat"
                                className={`font-medium ${location.pathname === '/chat' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                                aria-current={location.pathname === '/chat' ? 'page' : undefined}
                            >
                                Chat
                            </Link>
                        )}
                        <Link
                            to="/help"
                            className={`font-medium ${location.pathname === '/help' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                            aria-current={location.pathname === '/help' ? 'page' : undefined}
                        >
                            Help
                        </Link>
                        {isLoggedIn && userRole !== 'seller' && (
                            <Link
                                to="/cart"
                                className={`relative font-medium ${location.pathname === '/cart' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                                aria-label={`View your shopping cart, ${cartItems.length} items`}
                                aria-current={location.pathname === '/cart' ? 'page' : undefined}
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
                                    <Link to="/admin" className={`font-medium ${location.pathname === '/admin' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}>
                                        Admin
                                    </Link>
                                )}
                                {userRole === 'seller' && (
                                    <Link to="/seller-dashboard" className={`font-medium ${location.pathname === '/seller-dashboard' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}>
                                        Dashboard
                                    </Link>
                                )}
                                <Link to="/account" className={`font-medium ${location.pathname === '/account' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}>
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
                            className="text-gray-600 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            aria-expanded={isMobileMenuOpen}
                            aria-controls="mobile-menu"
                            aria-label={isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}
                        >
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-200 shadow-lg" id="mobile-menu" role="menu">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            <Link
                                to="/marketplace"
                                className={`block px-3 py-2 text-base font-medium hover:bg-gray-50 ${location.pathname === '/marketplace' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                                aria-current={location.pathname === '/marketplace' ? 'page' : undefined}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Marketplace
                            </Link>
                            {isLoggedIn && (
                                <Link
                                    to="/chat"
                                    className={`block px-3 py-2 text-base font-medium hover:bg-gray-50 ${location.pathname === '/chat' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                                    aria-current={location.pathname === '/chat' ? 'page' : undefined}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Chat
                                </Link>
                            )}
                            <Link
                                to="/help"
                                className={`block px-3 py-2 text-base font-medium hover:bg-gray-50 ${location.pathname === '/help' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                                aria-current={location.pathname === '/help' ? 'page' : undefined}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Help
                            </Link>
                            {isLoggedIn && userRole !== 'seller' && (
                                <Link
                                    to="/cart"
                                    className={`flex items-center px-3 py-2 text-base font-medium hover:bg-gray-50 ${location.pathname === '/cart' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                                    aria-label={`View your shopping cart, ${cartItems.length} items`}
                                    aria-current={location.pathname === '/cart' ? 'page' : undefined}
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
                                                className={`block px-3 py-2 text-base font-medium hover:bg-gray-50 ${location.pathname === '/admin' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Admin
                                            </Link>
                                        )}
                                        {userRole === 'seller' && (
                                            <Link
                                                to="/seller-dashboard"
                                                className={`block px-3 py-2 text-base font-medium hover:bg-gray-50 ${location.pathname === '/seller-dashboard' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Dashboard
                                            </Link>
                                        )}
                                        <Link
                                            to="/account"
                                            className={`block px-3 py-2 text-base font-medium hover:bg-gray-50 ${location.pathname === '/account' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
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