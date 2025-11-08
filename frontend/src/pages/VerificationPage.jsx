import React, { useRef } from 'react';

const VerificationPage = () => {
  const inputRefs = useRef([]);

  // Function to handle input change and move focus
  const handleChange = (e, index) => {
    const { value } = e.target;
    // Only allow single digit input
    if (value.length > 1) {
      e.target.value = value.charAt(0);
    }

    // Move to next input if a digit is entered and not the last input
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = inputRefs.current.map(input => input.value).join('');
    console.log('Verification Code:', code);
    // Here you would typically send the code to your backend for verification
    alert(Verifying );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 flex items-center p-4 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {/* Green circle with play icon - Logo */}
          <div className="bg-green-500 rounded-full p-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold text-gray-800">Local Finds</span>
        </div>
      </header>

      {/* Main Content - Centered Card */}
      <div className="flex flex-col items-center justify-center flex-grow pt-20"> {/* pt-20 to push content below fixed header */}
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
            <a href="#" className="text-green-600 hover:text-green-700 font-medium">Resend</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;