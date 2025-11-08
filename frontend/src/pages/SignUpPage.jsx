import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { EyeIcon, EyeOffIcon, User, Store } from 'lucide-react';
import axiosInstance from '../axiosintreceptor.js';

const SignUpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const userTypeFromQuery = new URLSearchParams(location.search).get('type') || 'buyer';
  const [userType, setUserType] = useState(userTypeFromQuery);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    pinCode: '',
    businessName: '',
    businessCategory: '',
    bio: '',
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const typeFromQuery = new URLSearchParams(location.search).get('type') || 'buyer';
    setUserType(typeFromQuery);
  }, [location.search]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      address: formData.address,
      pinCode: formData.pinCode,
      role: userType,
    };

    if (userType === 'seller') {
      payload.businessName = formData.businessName;
      payload.businessCategory = formData.businessCategory;
      payload.bio = formData.bio;
    } else {
      delete payload.businessName;
      delete payload.businessCategory;
      delete payload.bio;
    }

    try {
      await axiosInstance.post('/user/register', payload);
      navigate('/signin');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      {/* Split-screen layout */}
      <div className="flex flex-1 flex-col lg:flex-row pt-20 flex-grow">
        {/* Left side - Branding/Illustration */}
        <div className="flex-1 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center p-8 lg:p-12 order-2 lg:order-1">
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
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">Connect Buyers & Sellers Locally</h1>
            <p className="text-lg lg:text-xl opacity-90">Find the perfect products from local sellers or showcase your items to nearby buyers.</p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12 order-1 lg:order-2">
          <div className="w-full max-w-md">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Create your account</h2>
            <p className="text-center text-green-600 text-sm mb-6">Join us today</p>

            {/* User Type Toggle */}
            <div className="flex justify-center bg-gray-200 rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => setUserType('buyer')}
                className={`w-1/2 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${userType === 'buyer' ? 'bg-white text-green-600 shadow' : 'text-gray-600'}`}
              >
                I'm a Buyer
              </button>
              <button
                type="button"
                onClick={() => setUserType('seller')}
                className={`w-1/2 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${userType === 'seller' ? 'bg-white text-green-600 shadow' : 'text-gray-600'}`}
              >
                I'm a Seller
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
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
              <div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  name="address"
                  placeholder="Full Address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  name="pinCode"
                  placeholder="Pin Code"
                  value={formData.pinCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {userType === 'seller' && (
                <>
                  <div className="pt-2">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">Business Details</h3>
                  </div>
                  <div>
                    <input
                      type="text"
                      name="businessName"
                      placeholder="Business Name"
                      value={formData.businessName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="businessCategory"
                      placeholder="Business Categories (comma-separated)"
                      value={formData.businessCategory}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </>
              )}

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
                  {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={isConfirmPasswordVisible ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                >
                  {isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Sign Up
              </button>
            </form>

            <p className="text-center text-gray-600 text-sm mt-4">
              Already have an account? <Link to="/signin" className="text-green-600 hover:text-green-700 font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default SignUpPage;
