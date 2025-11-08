import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import axiosInstance from '../axiosintreceptor.js';
import toast from 'react-hot-toast';
import { Users, Package, Trash2, UserPlus, MessageSquare } from 'lucide-react';

const AdminDashboardPage = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProducts: 0,
        totalBuyers: 0,
        totalSellers: 0,
        totalInquiries: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, productsRes, inquiriesRes] = await Promise.all([
                axiosInstance.get('/admin/users'),
                axiosInstance.get('/admin/products'),
                axiosInstance.get('/admin/inquiries')
            ]);

            setUsers(usersRes.data.users);
            setProducts(productsRes.data.products);
            setInquiries(inquiriesRes.data.inquiries);

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
                totalInquiries: inquiriesRes.data.count
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'users'
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Users ({stats.totalUsers})
                            </button>
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'products'
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Products ({stats.totalProducts})
                            </button>
                            <button
                                onClick={() => setActiveTab('inquiries')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'inquiries'
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Inquiries ({stats.totalInquiries})
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
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
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
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {inquiries.map((inquiry) => (
                                                    <tr key={inquiry._id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inquiry.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inquiry.email}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inquiry.subject}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                inquiry.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                                inquiry.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {inquiry.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(inquiry.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <button
                                                                onClick={() => handleDeleteInquiry(inquiry._id)}
                                                                className="text-red-600 hover:text-red-900 flex items-center mr-2"
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
                                ) : (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <h4 className="text-xl font-medium text-gray-900 mb-2">No inquiries yet</h4>
                                        <p className="text-gray-600">Customer support inquiries from the help page will appear here.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AdminDashboardPage;
