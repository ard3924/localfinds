import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, ArrowUp } from 'lucide-react';

// --- Data for Footer Links ---
const footerSections = [
    {
        title: 'Quick Links',
        links: [
            { text: 'Log In', to: '/signin' },
            { text: 'Marketplace', to: '/marketplace' },
            { text: 'Become a Seller', to: '/signup?type=seller' },
        ],
    },
    {
        title: 'Support',
        links: [
            { text: 'Help Center', to: '/help' },
            { text: 'Contact Us', to: '/help' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { text: 'Privacy Policy', to: '/privacy-policy' },
            { text: 'Terms of Service', to: '/terms-of-service' },
        ],
    },
];

const socialLinks = [
    { href: '#', icon: <Facebook size={20} />, label: 'Visit our Facebook page' },
    { href: '#', icon: <Twitter size={20} />, label: 'Visit our Twitter page' },
    { href: '#', icon: <Instagram size={20} />, label: 'Visit our Instagram page' },
    { href: '#', icon: <Linkedin size={20} />, label: 'Visit our LinkedIn page' },
];

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
                <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        {/* About Section */}
                        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                            <h3 className="text-xl sm:text-2xl font-bold text-green-600">LocalFinds</h3>
                            <p className="mt-2 text-gray-500 text-sm">Discover your neighborhood's hidden gems and support local sellers.</p>
                        </div>

                        {/* Dynamic Footer Sections */}
                        {footerSections.map((section) => (
                            <div key={section.title}>
                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{section.title}</h4>
                                <ul className="mt-3 sm:mt-4 space-y-2">
                                    {section.links.map((link) => (
                                        <li key={link.text}>
                                            <Link to={link.to} className="text-gray-500 hover:text-green-600 text-sm mobile-touch-target inline-block py-1">{link.text}</Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center">
                        <p className="text-gray-500 text-xs sm:text-sm">&copy; {new Date().getFullYear()} LocalFinds. All rights reserved.</p>
                        <div className="flex space-x-3 sm:space-x-4 mt-4 sm:mt-0">
                            {socialLinks.map((social) => (
                                <a key={social.label} href={social.href} className="text-gray-400 hover:text-gray-600 mobile-touch-target p-2" aria-label={social.label}>{social.icon}</a>
                            ))}
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
