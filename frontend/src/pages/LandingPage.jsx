import React from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import FeatureCard from '../components/FeatureCard.jsx';
import { Cpu, MapPin, Search } from 'lucide-react';


// Main Landing Page Component
export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="flex-grow">
                <section className="relative bg-gray-100 pt-20 pb-20">
                    {/* Decorative background with illustration */}
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: "url('path_to_your_illustration.svg')", opacity: 0.1 }}
                    // Fallback for when you don't have the image yet
                    ></div>
                    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
                            Discover Your <br /> Neighborhood's <span className="text-green-600">Hidden Gems</span>
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
                            Connect with local sellers and find items you won't find anywhere else. Our AI-powered recommendations help you discover products tailored to your interests.
                        </p>
                        <div className="mt-8 flex justify-center space-x-4">
                            <a href="/marketplace" className="px-8 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-300">
                                Shop Now
                            </a>
                            <a href="/signup?type=seller" className="px-8 py-3 bg-white text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition duration-300">
                                Start Selling
                            </a>
                        </div>
                    </div>
                </section>
                <section className="bg-white py-20 sm:py-28">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
                            <p className="mt-4 text-lg text-gray-600">Our platform makes it easy to buy and sell locally. Here's a simple guide.</p>
                        </div>
                        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FeatureCard icon={<MapPin />} title="Find Local Sellers">
                                Browse a wide variety of products from sellers in your area.
                            </FeatureCard>
                            <FeatureCard icon={<Search />} title="Discover Unique Items">
                                Find one-of-a-kind items you won't find in big box stores.
                            </FeatureCard>
                            <FeatureCard icon={<Cpu />} title="AI-Powered Recommendations">
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