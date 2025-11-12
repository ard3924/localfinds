import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import axiosInstance from '../axiosintreceptor.js';
import toast from 'react-hot-toast';
import { Users, Package, Trash2, UserPlus, MessageSquare, AlertTriangle, Flag, TrendingUp, BarChart3, X } from 'lucide-react';

const AdminDashboardPage = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [reports, setReports] = useState([]);
    const [productTrends, setProductTrends] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProducts: 0,
        totalBuyers: 0,
        totalSellers: 0,
        totalInquiries: 0,
        totalReports: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, productsRes, inquiriesRes, reportsRes, trendsRes] = await Promise.all([
                axiosInstance.get('/admin/users'),
                axiosInstance.get('/admin/products'),
                axiosInstance.get('/admin/inquiries'),
                axiosInstance.get('/reports'),
                axiosInstance.get('/admin/product-trends')
            ]);

            setUsers(usersRes.data.users);
            setProducts(productsRes.data.products);
            setInquiries(inquiriesRes.data.inquiries);
            setReports(reportsRes.data.reports);
            setProductTrends(trendsRes.data.data);

            // Calculate stats
            const buyers = usersRes.data.users.filter(user => user.role === 'buyer').length;
            const sellers = usersRes.data.users.filter(user => user.role === 'seller').length;
            const admins = usersRes.data.users.filter(user => user.role === 'admin').length;

            setStats({
                totalUsers: usersRes.data.count,
                totalProducts: productsRes.data.count,
                totalBuyers: buyers,
                totalSellers: sellers,
                totalAdmins: admins,
                totalInquiries: inquiriesRes.data.count,
                totalReports: reportsRes.data.reports.length
            });
        } catch (error) {
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await axiosInstance.delete(`/admin/user/${userId}`);
            toast.success('User deleted successfully');
            fetchData(); // Refresh data
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            await axiosInstance.delete(`/admin/product/${productId}`);
            toast.success('Product deleted successfully');
            fetchData(); // Refresh data
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    const handleDeleteInquiry = async (inquiryId) => {
        if (!window.confirm('Are you sure you want to delete this inquiry?')) return;

        try {
            await axiosInstance.delete(`/admin/inquiry/${inquiryId}`);
            toast.success('Inquiry deleted successfully');
            fetchData(); // Refresh data
        } catch (error) {
            toast.error('Failed to delete inquiry');
        }
    };

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm('Are you sure you want to delete this report?')) return;

        try {
            await axiosInstance.delete(`/reports/${reportId}`);
            toast.success('Report deleted successfully');
            fetchData(); // Refresh data
        } catch (error) {
            toast.error('Failed to delete report');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-24">
                    <div className="text-center">Loading admin dashboard...</div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="w-full max-w-7xl mx-auto px-4 py-8 pt-24 flex-grow">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                    <p className="text-gray-600">Manage users and products across the platform</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center">
                            <Users className="h-8 w-8 text-blue-500 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center">
                            <Package className="h-8 w-8 text-green-500 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Products</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center">
                            <UserPlus className="h-8 w-8 text-purple-500 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Buyers</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalBuyers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center">
                            <Package className="h-8 w-8 text-orange-500 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Sellers</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalSellers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center">
                            <MessageSquare className="h-8 w-8 text-indigo-500 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Inquiries</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalInquiries}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center">
                            <Flag className="h-8 w-8 text-red-500 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Reports</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Analytics Button */}
                <div className="mb-8">
                    <button
                        onClick={() => setShowAnalyticsModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg flex items-center transition-colors"
                    >
                        <BarChart3 className="h-5 w-5 mr-2" />
                        View Product Analytics
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Users ({stats.totalUsers})
                            </button>
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'products'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Products ({stats.totalProducts})
                            </button>
                            <button
                                onClick={() => setActiveTab('inquiries')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'inquiries'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Inquiries ({stats.totalInquiries})
                            </button>
                            <button
                                onClick={() => setActiveTab('reports')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'reports'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Reports ({stats.totalReports})
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'users' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Users</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {users.map((user) => (
                                                <tr key={user._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                                            user.role === 'seller' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => handleDeleteUser(user._id)}
                                                            className="text-red-600 hover:text-red-900 flex items-center"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'products' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Products</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {products.map((product) => (
                                                <tr key={product._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.price}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {product.seller?.name || 'Unknown'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => handleDeleteProduct(product._id)}
                                                            className="text-red-600 hover:text-red-900 flex items-center"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'inquiries' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Inquiries</h3>
                                {inquiries.length > 0 ? (
                                    <div className="space-y-4">
                                        {inquiries.map((inquiry) => (
                                            <div key={inquiry._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-4 mb-2">
                                                            <div className="flex items-center">
                                                                <span className="text-sm font-medium text-gray-700">Name:</span>
                                                                <span className="ml-2 text-sm text-gray-900">{inquiry.name}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <span className="text-sm font-medium text-gray-700">Email:</span>
                                                                <span className="ml-2 text-sm text-gray-900">{inquiry.email}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <span className="text-sm font-medium text-gray-700">Subject:</span>
                                                                <span className="ml-2 text-sm text-gray-900">{inquiry.subject}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <span className="text-sm font-medium text-gray-700">Date:</span>
                                                                <span className="ml-2 text-sm text-gray-500">{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <span className="text-sm font-medium text-gray-700">Status:</span>
                                                                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${inquiry.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                                    inquiry.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {inquiry.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="mb-3">
                                                            <span className="text-sm font-medium text-gray-700">Message:</span>
                                                            <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border-l-4 border-blue-200">
                                                                {inquiry.message}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteInquiry(inquiry._id)}
                                                        className="text-red-600 hover:text-red-900 flex items-center px-3 py-1 border border-red-300 rounded-md hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <h4 className="text-xl font-medium text-gray-900 mb-2">No inquiries yet</h4>
                                        <p className="text-gray-600">Customer support inquiries from the help page will appear here.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Reports</h3>
                                {reports.length > 0 ? (
                                    <div className="space-y-4">
                                        {reports.map((report) => (
                                            <div key={report._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-4 mb-2">
                                                            <div className="flex items-center">
                                                                <span className="text-sm font-medium text-gray-700">Reporter:</span>
                                                                <span className="ml-2 text-sm text-gray-900">{report.reporter?.name || 'Unknown'}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <span className="text-sm font-medium text-gray-700">Product:</span>
                                                                <button
                                                                    onClick={() => window.open(`/product/${report.product?._id}`, '_blank')}
                                                                    className="ml-2 text-sm text-blue-600 hover:text-blue-800 underline hover:no-underline"
                                                                >
                                                                    {report.product?.name || 'Unknown Product'}
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <span className="text-sm font-medium text-gray-700">Date:</span>
                                                                <span className="ml-2 text-sm text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="mb-3">
                                                            <span className="text-sm font-medium text-gray-700">Report Message:</span>
                                                            <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border-l-4 border-red-200">
                                                                {report.note}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteReport(report._id)}
                                                        className="text-red-600 hover:text-red-900 flex items-center px-3 py-1 border border-red-300 rounded-md hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <Flag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <h4 className="text-xl font-medium text-gray-900 mb-2">No reports yet</h4>
                                        <p className="text-gray-600">Product reports will appear here.</p>
                                    </div>
                                )}
                            </div>
                        )}


                    </div>
                </div>



                {/* Customer Inquiries Section */}
                <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Customer Inquiries</h3>
                    {inquiries.length > 0 ? (
                        <div className="space-y-4">
                            {inquiries.slice(0, 5).map((inquiry) => (
                                <div key={inquiry._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-4 mb-2">
                                                <div className="flex items-center">
                                                    <span className="text-sm font-medium text-gray-700">Name:</span>
                                                    <span className="ml-2 text-sm text-gray-900">{inquiry.name}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-sm font-medium text-gray-700">Email:</span>
                                                    <span className="ml-2 text-sm text-gray-900">{inquiry.email}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-sm font-medium text-gray-700">Subject:</span>
                                                    <span className="ml-2 text-sm text-gray-900">{inquiry.subject}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-sm font-medium text-gray-700">Date:</span>
                                                    <span className="ml-2 text-sm text-gray-500">{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-sm font-medium text-gray-700">Status:</span>
                                                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${inquiry.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                        inquiry.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {inquiry.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <span className="text-sm font-medium text-gray-700">Message:</span>
                                                <p className="mt-1 text-sm text-gray-900 bg-white p-3 rounded-md border-l-4 border-blue-200">
                                                    {inquiry.message}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteInquiry(inquiry._id)}
                                            className="text-red-600 hover:text-red-900 flex items-center px-3 py-1 border border-red-300 rounded-md hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {inquiries.length > 5 && (
                                <div className="text-center">
                                    <button
                                        onClick={() => setActiveTab('inquiries')}
                                        className="text-green-600 hover:text-green-700 font-medium"
                                    >
                                        View All Inquiries ({stats.totalInquiries})
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h4 className="text-xl font-medium text-gray-900 mb-2">No inquiries yet</h4>
                            <p className="text-gray-600">Customer support inquiries from the help page will appear here.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Product Analytics Modal */}
            {showAnalyticsModal && (
                <div className="fixed inset-0 g-opacity-3 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Product Analytics</h3>
                            <button
                                onClick={() => setShowAnalyticsModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            {productTrends ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="bg-white p-6 rounded-xl shadow-lg border">
                                            <div className="flex items-center">
                                                <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">Most Viewed Product</p>
                                                    <p className="text-lg font-bold text-gray-900">{productTrends.mostViewed?.name || 'N/A'}</p>
                                                    <p className="text-sm text-gray-500">{productTrends.mostViewed?.views || 0} views</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-xl shadow-lg border">
                                            <div className="flex items-center">
                                                <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">Top Category</p>
                                                    <p className="text-lg font-bold text-gray-900">{productTrends.topCategory?.category || 'N/A'}</p>
                                                    <p className="text-sm text-gray-500">{productTrends.topCategory?.count || 0} products</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-xl shadow-lg border">
                                            <div className="flex items-center">
                                                <Package className="h-8 w-8 text-purple-500 mr-3" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">Average Price</p>
                                                    <p className="text-lg font-bold text-gray-900">${productTrends.averagePrice?.toFixed(2) || '0.00'}</p>
                                                    <p className="text-sm text-gray-500">Across all products</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl shadow-lg border">
                                        <h4 className="text-md font-semibold text-gray-900 mb-4">Top 5 Products by Views</h4>
                                        <div className="space-y-3">
                                            {productTrends.topProducts?.slice(0, 5).map((product, index) => (
                                                <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-medium text-gray-600 mr-3">#{index + 1}</span>
                                                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                                                    </div>
                                                    <span className="text-sm text-gray-500">{product.views} views</span>
                                                </div>
                                            )) || <p className="text-gray-500">No data available</p>}
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl shadow-lg border">
                                        <h4 className="text-md font-semibold text-gray-900 mb-4">Category Distribution</h4>
                                        <div className="space-y-3">
                                            {productTrends.categoryStats?.map((cat, index) => (
                                                <div key={`${cat.category}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-sm font-medium text-gray-900">{cat.category}</span>
                                                    <div className="flex items-center">
                                                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                                                            <div
                                                                className="bg-blue-500 h-2 rounded-full"
                                                                style={{ width: `${(cat.count / productTrends.totalProducts) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm text-gray-500">{cat.count}</span>
                                                    </div>
                                                </div>
                                            )) || <p className="text-gray-500">No data available</p>}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg p-8 text-center">
                                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <h4 className="text-xl font-medium text-gray-900 mb-2">No analytics data yet</h4>
                                    <p className="text-gray-600">Analytics data will appear here once products are viewed.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default AdminDashboardPage;
