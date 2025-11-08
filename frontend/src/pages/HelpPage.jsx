import React, { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

// --- FAQ Data ---
const faqs = [
  {
    question: "How do I create an account?",
    answer: "Click on 'Sign Up' in the top navigation. Choose whether you're a buyer or seller, fill in your details, and verify your email."
  },
  {
    question: "How do I list an item for sale?",
    answer: "After signing up as a seller, go to your profile and click 'Sell'. Upload photos, add a description, set your price, and publish your listing."
  },
  {
    question: "How do I search for products?",
    answer: "Use the search bar in the navigation or browse categories on the marketplace page. You can also use filters to narrow down results."
  },
  {
    question: "How do I contact a seller?",
    answer: "Click on any product listing and use the 'Chat with Seller' button to start a conversation."
  },
  {
    question: "What are the fees for using LocalFinds?",
    answer: "LocalFinds is free to use for both buyers and sellers. We may introduce premium features in the future."
  },
  {
    question: "How do I report a suspicious listing or user?",
    answer: "Use the 'Report' button on any listing or contact our support team directly through the help form below."
  }
];

// --- HelpPage Component ---
const HelpPage = () => {
  const [openFAQ, setOpenFAQ] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const handleContactChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    alert('Thank you for your message! We\'ll get back to you soon.');
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600">Find answers to common questions or get in touch with our support team.</p>
        </div>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md">
                <button
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                  <svg
                    className={`w-6 h-6 text-gray-500 transform transition-transform ${openFAQ === index ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Contact Support</h2>
          <p className="text-gray-600 mb-8 text-center">
            Can't find what you're looking for? Send us a message and we'll get back to you as soon as possible.
          </p>

          <form onSubmit={handleContactSubmit} className="max-w-2xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={contactForm.name}
                  onChange={handleContactChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={contactForm.email}
                  onChange={handleContactChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={contactForm.subject}
                onChange={handleContactChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                id="message"
                name="message"
                rows="6"
                value={contactForm.message}
                onChange={handleContactChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Describe your issue or question in detail..."
              ></textarea>
            </div>

            <div className="text-center">
              <button
                type="submit"
                className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Send Message
              </button>
            </div>
          </form>
        </section>

        {/* Additional Resources */}
        <section className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Safety Guidelines</h3>
              <p className="text-gray-600 mb-4">Learn about safe buying and selling practices on our platform.</p>
              <a href="#" className="text-green-600 hover:text-green-700 font-medium">Read More →</a>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Seller Handbook</h3>
              <p className="text-gray-600 mb-4">Tips and best practices for successful selling on LocalFinds.</p>
              <a href="#" className="text-green-600 hover:text-green-700 font-medium">Read More →</a>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Community Forum</h3>
              <p className="text-gray-600 mb-4">Connect with other users and share your experiences.</p>
              <a href="#" className="text-green-600 hover:text-green-700 font-medium">Join Discussion →</a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HelpPage;
