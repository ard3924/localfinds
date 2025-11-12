import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { Eye, EyeOff, User, Store } from 'lucide-react';
import Footer from '../components/Footer.jsx';
import axiosInstance from '../axiosintreceptor.js';
import toast from 'react-hot-toast';

const SignInPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.post('/user/login', formData);
      localStorage.setItem('token', response.data.token);
      toast.success('Signed in successfully!');
      navigate('/marketplace');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-250 bg-gray-100 flex flex-col">
      <Navbar />

      {/* Split-screen layout */}
      <div className="flex flex-col lg:flex-row flex-1 pt-20">
        {/* Left side - Branding/Illustration */}
        <div className="hidden lg:flex flex-1 h-full bg-gradient-to-br from-green-500 to-green-600 items-center justify-center p-8 lg:p-12 order-2 lg:order-1">
          <div className="text-center text-white max-w-md">
            <div className="mb-8">
              {/* Simple icons representing buyers and sellers */}
              <div className="flex justify-center space-x-8 mb-6">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8" />
                </div>
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Store className="w-8 h-8" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">Welcome Back to LocalFinds</h1>
            <p className="text-lg lg:text-xl opacity-90">Your local marketplace is just a sign-in away. Discover new deals and manage your listings.</p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="flex-1 lg:flex-1 h-full flex items-center justify-center p-8 lg:p-12 order-1 lg:order-2">
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Sign in to your account</h2>
            <p className="text-center text-green-600 text-sm mb-6">Or <Link to="/signup" className="hover:underline">create a new account</Link></p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="relative">
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                >
                  {isPasswordVisible ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>

              <div className="flex items-center justify-end text-sm">
                <Link to="/forgot-password" className="text-green-600 hover:text-green-700 font-medium">Forgot your password?</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 disabled:bg-green-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SignInPage;