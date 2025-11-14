import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import FeatureCard from '../components/FeatureCard.jsx';
import { Cpu, MapPin, Search, Heart, Users, Gift } from 'lucide-react';
import axiosInstance from '../axiosintreceptor.js';
import ProductCard from '../components/ProductCard.jsx';
import ProductCardSkeleton from '../components/ProductCardSkeleton.jsx';
import landingBgImg from '../assets/landingherobgimg.avif';
import supportCommunityImg from '../assets/supportyourcomunity.avif';
import findTreasuresImg from '../assets/finduniquetreasures.avif';
import sustainableImg from '../assets/sustainable.avif';

// Reusable component for the "Why Shop Local" section with the 3D flip effect
const FlippingInfoCard = ({ frontImage, frontTitle, backIcon, backTitle, backText }) => (
    <div className="group h-80 [perspective:1000px]">
        <div className="relative h-full w-full rounded-lg shadow-lg transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
            {/* Front */}
            <div className="absolute inset-0 bg-cover bg-center rounded-lg [backface-visibility:hidden]" style={{ backgroundImage: `url('${frontImage}')` }}>
                <div className="absolute inset-0 bg-black opacity-50 rounded-lg"></div>
                <div className="relative h-full flex items-center justify-center">
                    <h3 className="text-2xl font-bold">{frontTitle}</h3>
                </div>
            </div>
            {/* Back */}
            <div className="absolute inset-0 rounded-lg bg-green-600 p-6 flex flex-col justify-center items-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                {backIcon}
                <h3 className="text-2xl font-bold text-center">{backTitle}</h3>
                <p className="mt-2 text-gray-200 text-center">{backText}</p>
            </div>
        </div>
    </div>
);

const whyShopLocalData = [
    { frontImage: supportCommunityImg, frontTitle: 'Support Your Community', backIcon: <Users className="w-12 h-12 mb-4" />, backTitle: 'Support Your Community', backText: 'Your purchases directly support local artisans and small business owners.' },
    { frontImage: findTreasuresImg, frontTitle: 'Find Unique Treasures', backIcon: <Gift className="w-12 h-12 mb-4" />, backTitle: 'Find Unique Treasures', backText: 'Discover one-of-a-kind, handcrafted items with a personal touch.' },
    { frontImage: sustainableImg, frontTitle: 'Sustainable & Personal', backIcon: <Heart className="w-12 h-12 mb-4" />, backTitle: 'Sustainable & Personal', backText: 'Enjoy a more personal shopping experience and reduce your carbon footprint.' },
];

// Main Landing Page Component
export default function LandingPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loadingFeatured, setLoadingFeatured] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Set isMounted to true after a short delay to trigger the animation
        const timer = setTimeout(() => setIsMounted(true), 100);

        const fetchFeaturedProducts = async () => {
            setLoadingFeatured(true);
            try {
                // Optimized API call to fetch only 4 products for the featured section.
                const response = await axiosInstance.get('/products?limit=4');
                if (response.data.success) {
                    setFeaturedProducts(response.data.products);
                }
            } catch (error) {
                console.error("Failed to fetch featured products:", error);
            } finally {
                setLoadingFeatured(false);
            }
        };

        fetchFeaturedProducts();

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="flex-grow">
                <section className="relative pt-20 pb-20 text-white">
                    {/* Background Image and Overlay */}
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src={landingBgImg}
                            alt="A vibrant local market with unique goods"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black opacity-50"></div>
                    </div>

                    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center overflow-hidden">
                        <h1
                            className={`text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight transition-all duration-700 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                }`}
                        >
                            Discover Your <br /> Neighborhood's <span className="text-green-600">Hidden Gems</span>
                        </h1>
                        <p
                            className={`mt-6 max-w-2xl mx-auto text-lg text-gray-200 transition-all duration-700 ease-out delay-200 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                }`}
                        >
                            Connect with local sellers and find items you won't find anywhere else. Our AI-powered recommendations help you discover products tailored to your interests.
                        </p>
                        <div
                            className={`mt-8 flex justify-center space-x-4 transition-all duration-700 ease-out delay-300 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                }`}
                        >
                            <Link to="/marketplace" className="px-8 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-300">
                                Shop Now
                            </Link>
                            <Link to="/signup?type=seller" className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition duration-300">
                                Start Selling
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Featured Products Section */}
                <section className="bg-gray-50 py-20 sm:py-28">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
                            <p className="mt-4 text-lg text-gray-600">Get a glimpse of the unique items on LocalFinds.</p>
                        </div>
                        {loadingFeatured ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {[...Array(4)].map((_, index) => <ProductCardSkeleton key={index} />)}
                            </div>
                        ) : featuredProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {featuredProducts.map(product => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </div>
                        ) : null}
                        {!loadingFeatured && featuredProducts.length > 0 && (
                            <div className="text-center mt-12">
                                <button
                                    onClick={() => navigate('/marketplace')}
                                    className="px-8 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-300"
                                >
                                    Explore More Products
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Why Shop Local Section */}
                <section className="bg-white py-20 sm:py-28">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900">Why Shop Local?</h2>
                            <p className="mt-4 text-lg text-gray-600">Experience the benefits of connecting with your community.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
                            {whyShopLocalData.map((card, index) => (
                                <FlippingInfoCard
                                    key={index}
                                    frontImage={card.frontImage}
                                    frontTitle={card.frontTitle}
                                    backIcon={card.backIcon}
                                    backTitle={card.backTitle}
                                    backText={card.backText}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-gray-50 py-20 sm:py-28">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
                            <p className="mt-4 text-lg text-gray-600">Our platform makes it easy to buy and sell locally. Here's a simple guide.</p>
                        </div>
                        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FeatureCard key="find" icon={<MapPin />} title="Find Local Sellers">
                                Browse a wide variety of products from sellers in your area.
                            </FeatureCard>
                            <FeatureCard key="discover" icon={<Search />} title="Discover Unique Items">
                                Find one-of-a-kind items you won't find in big box stores.
                            </FeatureCard>
                            <FeatureCard key="ai" icon={<Cpu />} title="AI-Powered Recommendations">
                                Get personalized product suggestions based on your interests and past purchases.
                            </FeatureCard>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}