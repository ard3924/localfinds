import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosintreceptor.js';
import toast from 'react-hot-toast';
import { ShoppingCart } from 'lucide-react';

const VerificationPage = () => {
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { email, purpose } = location.state || {};

  useEffect(() => {
    if (!email || (purpose !== 'forgot-password' && purpose !== 'change-password')) {
      navigate('/forgot-password');
    }
  }, [email, purpose, navigate]);

  // Function to handle input change and move focus
  const handleChange = (e, index) => {
    let { value } = e.target;
    // Allow pasting multiple digits
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6 - index);
      for (let i = 0; i < digits.length; i++) {
        if (index + i < inputRefs.current.length) {
          inputRefs.current[index + i].value = digits[i];
        }
      }
      const nextIndex = index + digits.length;
      if (nextIndex < inputRefs.current.length) {
        inputRefs.current[nextIndex].focus();
      }
      return;
    }
    // Single digit input
    e.target.value = value.replace(/\D/g, '');
    if (e.target.value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Function to handle backspace and move focus
  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = inputRefs.current.map(input => input.value).join('');

    if (otp.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/user/verify-otp', { email, otp });
      toast.success('OTP verified successfully!');
      // Navigate to reset password page with reset token
      navigate('/reset-password', { state: { resetToken: response.data.resetToken } });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Invalid OTP. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      await axiosInstance.post('/user/forgot-password', { email });
      toast.success('OTP resent successfully!');
    } catch (error) {
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 flex items-center p-4 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {/* Green circle with play icon - Logo */}
            <ShoppingCart className="h-5 w-5 text-[#00FF00]" />
          <span className="text-lg font-semibold text-gray-800">Local Finds</span>
        </div>
      </header>

      {/* Main Content - Centered Card */}
      <main className="flex flex-col items-center justify-center flex-grow pt-20">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter verification code</h2>
          <p className="text-gray-600 text-sm mb-8">
            We sent a verification code to your email. Please enter it below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-3 md:gap-4">
              {[...Array(6)].map((_, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                  ref={el => inputRefs.current[index] = el}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              ))}
            </div>

            <button
              type="submit"
              className="w-full max-w-xs bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 mt-6"
            >
              Verify
            </button>
          </form>

          <p className="mt-8 text-sm">
            <span className="text-gray-600">Didn't receive the code?</span>{' '}
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendLoading}
              className="text-green-600 hover:text-green-700 font-medium disabled:text-green-400"
            >
              {resendLoading ? 'Resending...' : 'Resend'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default VerificationPage;