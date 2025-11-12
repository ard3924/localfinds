import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import axiosInstance from '../axiosintreceptor.js';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axiosInstance.post('/user/forgot-password', { email });
            toast.success('If an account with that email exists, an OTP has been sent.');
            // Navigate to verification page with email
            navigate('/verify-otp', { state: { email, purpose: 'forgot-password' } });
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
            // Show a generic success message to prevent email enumeration
            toast.success('If an account with that email exists, an OTP has been sent.');
            console.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center px-4 py-20">
                <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                    <div>
                        <h2 className="text-center text-3xl font-extrabold text-gray-900">
                            Forgot Your Password?
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Enter your email address and we will send you an OTP to reset your password.
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Email address"
                            />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 disabled:bg-green-300">
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ForgotPasswordPage;