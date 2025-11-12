import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import AccountSidebar from '../components/AccountSidebar.jsx';
import axiosInstance from '../axiosintreceptor.js';
import toast from 'react-hot-toast';

const AccountPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        email: '',
        phone: '',
        address: '',
        pinCode: '',
        businessName: '',
        businessCategory: '',
        bio: ''
    });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            // NOTE: In a real app, you'd get the token from your auth context/storage.
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('You must be logged in to view this page.');
                setLoading(false);
                return;
            }

            try {
                const response = await axiosInstance.get('/user/account');
                setFormData({
                    name: response.data.name || '',
                    role: response.data.role || '',
                    email: response.data.email || '',
                    phone: response.data.phone || '',
                    address: response.data.address || '',
                    pinCode: response.data.pinCode || '',
                    businessName: response.data.businessName || '',
                    businessCategory: (response.data.businessCategory || []).join(', '),
                    bio: response.data.bio || ''
                });
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to load profile.';
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match.');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters long.');
            return;
        }

        setPasswordLoading(true);
        try {
            await axiosInstance.put('/user/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password changed successfully!');
            setShowPasswordChange(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password. Please try again.');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await axiosInstance.put('/user/account', formData);
            toast.success('Profile updated successfully!');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update profile.';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-center pt-32">Loading account...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="w-full max-w-7xl mx-auto px-4 py-8 pt-24 flex-grow grid grid-cols-1 lg:grid-cols-4 gap-8">
                <AccountSidebar />

                {/* Main Content Area */}
                <div className="lg:col-span-3 bg-white p-8 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>
                        <div className="flex gap-2">
                            {!isEditing && !showPasswordChange && (
                                <>
                                    <button
                                        onClick={() => setShowPasswordChange(true)}
                                        className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                                    >
                                        Change Password
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                                    >
                                        Edit Profile
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        placeholder="Full Name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                            isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50 text-gray-500'
                                        }`}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (cannot be changed)</label>
                                    <p id="email" className="w-full px-4 py-3 border border-gray-200 bg-gray-100 text-gray-500 rounded-lg">{formData.email}</p>
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        placeholder="Phone Number"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                            isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50 text-gray-500'
                                        }`}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="pinCode" className="block text-sm font-medium text-gray-700 mb-1">Pin Code</label>
                                    <input
                                        id="pinCode"
                                        type="text"
                                        name="pinCode"
                                        placeholder="Pin Code"
                                        value={formData.pinCode}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                            isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50 text-gray-500'
                                        }`}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mt-6">
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                                <input
                                    id="address"
                                    type="text"
                                    name="address"
                                    placeholder="Full Address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50 text-gray-500'
                                    }`}
                                    required
                                />
                            </div>
                        </div>

                        {formData.role === 'seller' && (
                            <div className="border-t pt-6 space-y-6">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Business Details</h3>
                                <input
                                    type="text"
                                    name="businessName"
                                    placeholder="Business Name"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50 text-gray-500'
                                    }`}
                                />
                                <input
                                    type="text"
                                    name="businessCategory"
                                    placeholder="Business Categories (comma-separated)"
                                    value={formData.businessCategory}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50 text-gray-500'
                                    }`}
                                />
                                <textarea
                                    name="bio"
                                    placeholder="Business Bio / Description"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    rows="4"
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50 text-gray-500'
                                    }`}
                                ></textarea>
                            </div>
                        )}

                        {isEditing && (
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Updating...' : 'Update Account'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </form>

                    {showPasswordChange && (
                        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Change Password</h3>
                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div className="relative">
                                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                        <input
                                            id="currentPassword"
                                            type="password"
                                            name="currentPassword"
                                            placeholder="Current Password"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div className="relative">
                                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                        <input
                                            id="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            name="newPassword"
                                            placeholder="New Password"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                                        >
                                            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            placeholder="Confirm New Password"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                                        >
                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    <div className="flex gap-4 mt-6">
                                        <button
                                            type="submit"
                                            disabled={passwordLoading}
                                            className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                                        >
                                            {passwordLoading ? 'Changing Password...' : 'Change Password'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordChange(false)}
                                            className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AccountPage;