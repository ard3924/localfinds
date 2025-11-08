import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { Eye, EyeOff } from 'lucide-react';
import axiosInstance from '../axiosintreceptor.js';
import toast from 'react-hot-toast';

const SignInPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');
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
    setError('');
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      {/* Split-screen layout */}
      <div className="flex flex-1 flex-col lg:flex-row pt-20">
        {/* Left side - Branding/Illustration */}
        <div className="flex-1 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center p-8 lg:p-12 order-2 lg:order-1">
          <div className="text-center text-white max-w-md">
            <div className="mb-8">
              {/* Simple icons representing buyers and sellers */}
              <div className="flex justify-center space-x-8 mb-6">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                </div>
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">Welcome Back to LocalFinds</h1>
            <p className="text-lg lg:text-xl opacity-90">Your local marketplace is just a sign-in away. Discover new deals and manage your listings.</p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12 order-1 lg:order-2">
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
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                >
                  {isPasswordVisible ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-700">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-green-600 rounded mr-2 focus:ring-green-500" />
                  Remember me
                </label>
                <a href="#" className="text-green-600 hover:text-green-700 font-medium">Forgot your password?</a>
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

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 w-full">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-500">&copy; 2024 LocalFinds. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <a href="#" className="text-gray-500 hover:text-gray-800">About</a>
            <a href="#" className="text-gray-500 hover:text-gray-800">Contact</a>
            <a href="#" className="text-gray-500 hover:text-gray-800">Terms of Service</a>
            <a href="#" className="text-gray-500 hover:text-gray-800">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SignInPage;