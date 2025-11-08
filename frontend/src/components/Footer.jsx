import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, ArrowUp } from 'lucide-react';

const Footer = () => {
    const [isVisible, setIsVisible] = useState(false);

    // Show button when page is scrolled down
    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    // Set up a listener for scroll events
    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    // Smooth scroll to top
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <>
            <footer className="bg-gray-100 text-gray-800 w-full border-t border-gray-200">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {/* About Section */}
                        <div className="col-span-2 md:col-span-1">
                            <h3 className="text-2xl font-bold text-green-600">LocalFinds</h3>
                            <p className="mt-2 text-gray-500 text-sm">Discover your neighborhood's hidden gems and support local sellers.</p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="font-semibold text-gray-900">Quick Links</h4>
                            <ul className="mt-4 space-y-2">
                                <li><Link to="/marketplace" className="text-gray-500 hover:text-green-600 text-sm">Marketplace</Link></li>
                                <li><Link to="/signup?type=seller" className="text-gray-500 hover:text-green-600 text-sm">Become a Seller</Link></li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h4 className="font-semibold text-gray-900">Support</h4>
                            <ul className="mt-4 space-y-2">
                                <li><Link to="/help" className="text-gray-500 hover:text-green-600 text-sm">Help Center</Link></li>
                                <li><Link to="/help" className="text-gray-500 hover:text-green-600 text-sm">Contact Us</Link></li>
                                <li><a href="#" className="text-gray-500 hover:text-green-600 text-sm">Safety Tips</a></li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="font-semibold text-gray-900">Legal</h4>
                            <ul className="mt-4 space-y-2">
                                <li><a href="#" className="text-gray-500 hover:text-green-600 text-sm">Privacy Policy</a></li>
                                <li><a href="#" className="text-gray-500 hover:text-green-600 text-sm">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-gray-200 pt-8 flex flex-col sm:flex-row justify-between items-center">
                        <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} LocalFinds. All rights reserved.</p>
                        <div className="flex space-x-4 mt-4 sm:mt-0">
                            <a href="#" className="text-gray-400 hover:text-gray-600"><Facebook size={20} /></a>
                            <a href="#" className="text-gray-400 hover:text-gray-600"><Twitter size={20} /></a>
                            <a href="#" className="text-gray-400 hover:text-gray-600"><Instagram size={20} /></a>
                            <a href="#" className="text-gray-400 hover:text-gray-600"><Linkedin size={20} /></a>
                        </div>
                    </div>
                </div>
            </footer>
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-opacity duration-300"
                    aria-label="Go to top"
                >
                    <ArrowUp className="h-6 w-6" />
                </button>
            )}
        </>
    );
};

export default Footer;
