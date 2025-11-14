import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import axiosInstance from '../axiosintreceptor.js';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';

const ResetPasswordPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { resetToken, purpose } = location.state || {};
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        if (!resetToken && purpose !== 'change-password') {
            navigate('/forgot-password');
        }
    }, [resetToken, purpose, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            await axiosInstance.post('/user/reset-password', { resetToken, password });
            toast.success('Password has been reset successfully! Please sign in.');
            navigate('/signin');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to reset password. The token may be invalid or expired.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            await axiosInstance.put('/user/change-password', { password });
            setShowSuccessModal(true);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to change password.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const submitHandler = purpose === 'change-password' ? handleChangePassword : handleSubmit;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center px-4 py-12 pt-24">
                <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                    <div>
                        <h2 className="text-center text-3xl font-extrabold text-gray-900">
                            {purpose === 'change-password' ? 'Change Your Password' : 'Reset Your Password'}
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Enter your new password below.
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={submitHandler}>
                        <div>
                            <label htmlFor="password">New Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="New Password"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password">Confirm New Password</label>
                            <input
                                id="confirm-password"
                                name="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Confirm New Password"
                            />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 disabled:bg-green-300">
                            {loading ? 'Resetting...' : (purpose === 'change-password' ? 'Change Password' : 'Reset Password')}
                        </button>
                    </form>
                </div>
            </div>
            <Footer />

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-blue-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Password Changed Successfully!</h3>
                        <p className="text-gray-600 mb-6">Your password has been updated. You can now continue using the application with your new password.</p>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                navigate('/account');
                            }}
                            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResetPasswordPage;