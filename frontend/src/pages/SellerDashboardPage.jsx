import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Upload, X, ChevronLeft, ChevronRight, Truck, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import axiosInstance from '../axiosintreceptor.js';
import toast from 'react-hot-toast';

const SellerDashboardPage = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        discountPercentage: '',
        discountStartDate: '',
        discountEndDate: '',
        images: []
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingProductId, setDeletingProductId] = useState(null);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusFormData, setStatusFormData] = useState({
        status: '',
        note: '',
        estimatedDelivery: ''
    });

    useEffect(() => {
        if (activeTab === 'products') {
            fetchProducts();
        } else if (activeTab === 'orders') {
            fetchOrders();
        }
    }, [activeTab]);

    const fetchProducts = async () => {
        try {
            const response = await axiosInstance.get('/products/myproducts');
            setProducts(response.data.products);
        } catch (error) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await axiosInstance.get('/orders/seller');
            setOrders(response.data.orders);
        } catch (error) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const addFiles = (newFiles) => {
        const imageFiles = Array.from(newFiles).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length !== newFiles.length) {
            toast.error('Only image files are accepted.');
        }
        if (imageFiles.length === 0) return;

        const combinedFiles = [...selectedFiles, ...imageFiles];

        if (combinedFiles.length > 5) {
            toast.error('You can upload a maximum of 5 images.');
            setSelectedFiles(combinedFiles.slice(0, 5));
        } else {
            setSelectedFiles(combinedFiles);
        }
    };



    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            category: '',
            images: []
        });
        setSelectedFiles([]);
        setEditingProduct(null);
        setShowAddForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedFiles.length === 0) {
            toast.error('At least one image is required');
            return;
        }

        setIsSubmitting(true);

        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('price', formData.price);
        formDataToSend.append('category', formData.category);

        // Add discount fields if provided
        if (formData.discountPercentage) {
            formDataToSend.append('discountPercentage', formData.discountPercentage);
        }
        if (formData.discountStartDate) {
            formDataToSend.append('discountStartDate', formData.discountStartDate);
        }
        if (formData.discountEndDate) {
            formDataToSend.append('discountEndDate', formData.discountEndDate);
        }

        selectedFiles.forEach((file) => {
            formDataToSend.append('images', file);
        });

        try {
            if (editingProduct) {
                await axiosInstance.put(`/products/${editingProduct._id}`, formDataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                toast.success('Product updated successfully');
            } else {
                await axiosInstance.post('/products/new', formDataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                toast.success('Product added successfully');
            }
            resetForm();
            setSelectedFiles([]);
            fetchProducts();
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to save product';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            category: product.category,
            images: product.images.length > 0 ? product.images : [{ url: '' }]
        });
        setShowAddForm(true);
    };

    const handleDelete = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            setDeletingProductId(productId);
            try {
                await axiosInstance.delete(`/products/${productId}`);
                toast.success('Product deleted successfully');
                fetchProducts();
            } catch (error) {
                toast.error('Failed to delete product');
            } finally {
                setDeletingProductId(null);
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        handleDragLeave(e); // Also resets isDragging to false
        addFiles(e.dataTransfer.files);
    };

    const handleStatusChange = (e) => {
        const { name, value } = e.target;
        setStatusFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const openStatusModal = (order) => {
        setSelectedOrder(order);
        setStatusFormData({
            status: order.status,
            note: '',
            estimatedDelivery: order.estimatedDelivery || ''
        });
        setShowStatusModal(true);
    };

    const closeStatusModal = () => {
        setShowStatusModal(false);
        setSelectedOrder(null);
        setStatusFormData({
            status: '',
            note: '',
            estimatedDelivery: ''
        });
    };

    const handleStatusSubmit = async (e) => {
        e.preventDefault();
        if (!selectedOrder) return;

        setUpdatingOrderId(selectedOrder._id);
        try {
            const updateData = {
                status: statusFormData.status,
                note: statusFormData.note
            };

            if (statusFormData.estimatedDelivery) {
                updateData.estimatedDelivery = statusFormData.estimatedDelivery;
            }

            await axiosInstance.put(`/orders/${selectedOrder._id}/status`, updateData);
            toast.success('Order status updated successfully');
            closeStatusModal();
            fetchOrders();
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to update order status';
            toast.error(errorMessage);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Loading your products...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 pt-24 max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Seller Dashboard</h1>
                    <p className="text-gray-600">Manage your products and orders</p>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                                activeTab === 'products'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Products
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                                activeTab === 'orders'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Orders
                        </button>
                    </div>
                </div>

                {activeTab === 'products' && (
                    <>
                        {/* Add Product Button */}
                        <div className="mb-6">
                            <button
                                onClick={() => {
                                    if (showAddForm) {
                                        resetForm(); // This will also set editingProduct to null
                                    }
                                    setShowAddForm(!showAddForm);
                                }}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                {showAddForm ? 'Cancel' : 'Add New Product'}
                            </button>
                        </div>

                        {/* Add/Edit Product Form */}
                        {showAddForm && (
                            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                                <h2 className="text-xl font-semibold mb-4">
                                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Product Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Category *
                                            </label>
                                            <input
                                                type="text"
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description *
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="4"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Price *
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </div>

                                    {/* Discount Section */}
                                    <div className="border-t pt-4 space-y-4">
                                        <h3 className="text-lg font-medium text-gray-900">Discount (Optional)</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Discount Percentage (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="discountPercentage"
                                                    value={formData.discountPercentage}
                                                    onChange={handleInputChange}
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    placeholder="e.g., 20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Start Date
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    name="discountStartDate"
                                                    value={formData.discountStartDate}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    End Date
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    name="discountEndDate"
                                                    value={formData.discountEndDate}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Product Images *
                                        </label>
                                        <div className="space-y-4">
                                            <div
                                                className={`border-2 border-dashed rounded-lg p-4 transition-colors ${isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
                                                onDragEnter={handleDragEnter}
                                                onDragLeave={handleDragLeave}
                                                onDragOver={handleDragOver}
                                                onDrop={handleDrop}
                                            >
                                                <div className="text-center">
                                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                    <div className="mt-4">
                                                        <label htmlFor="file-upload" className="cursor-pointer">
                                                            <span className="mt-2 block text-sm font-medium text-gray-900">
                                                                Upload product images
                                                            </span>
                                                            <input
                                                                id="file-upload"
                                                                name="images"
                                                                type="file"
                                                                multiple
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    addFiles(e.target.files);
                                                                    e.target.value = null; // Reset file input to allow re-selecting the same file
                                                                }}
                                                                className="sr-only"
                                                            />
                                                        </label>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            PNG, JPG, GIF up to 5MB each (max 5 images)
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedFiles.length > 0 && (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                        {selectedFiles.map((file, index) => (
                                                            <div key={index} className="relative">
                                                                <img
                                                                    src={URL.createObjectURL(file)}
                                                                    alt={`Preview ${index + 1}`}
                                                                    className="w-full h-24 object-cover rounded-lg cursor-pointer"
                                                                    onClick={() => {
                                                                        setCurrentImageIndex(index);
                                                                        setShowImageModal(true);
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCurrentImageIndex(0);
                                                            setShowImageModal(true);
                                                        }}
                                                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                                                    >
                                                        View all images ({selectedFiles.length})
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            type="submit"
                                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-300"
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Products List */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold">Your Products ({products.length})</h2>
                            </div>

                            {products.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">You haven't added any products yet.</p>
                                    <button
                                        onClick={() => setShowAddForm(true)}
                                        className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Add Your First Product
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Product
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Category
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Price
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {products.map((product) => (
                                                <tr key={product._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-12 w-12">
                                                                {product.images && product.images.length > 0 ? (
                                                                    <img
                                                                        className="h-12 w-12 rounded-lg object-cover"
                                                                        src={product.images[0].url}
                                                                        alt={product.name}
                                                                    />
                                                                ) : (
                                                                    <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                                                        <Package className="w-6 h-6 text-gray-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {product.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                                    {product.description}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm text-gray-900">{product.category}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            ${product.price}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => !deletingProductId && handleEdit(product)}
                                                            className="text-indigo-600 hover:text-indigo-900 mr-4 flex items-center gap-1 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                            disabled={!!deletingProductId}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product._id)}
                                                            className="text-red-600 hover:text-red-900 flex items-center gap-1 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                            disabled={!!deletingProductId}
                                                        >
                                                            {deletingProductId === product._id ? 'Deleting...' : (
                                                                <>
                                                                    <Trash2 className="w-4 h-4" /> Delete
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'orders' && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold">Your Orders ({orders.length})</h2>
                        </div>

                        {orders.length === 0 ? (
                            <div className="p-8 text-center">
                                <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No orders yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Order ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {orders.map((order) => (
                                            <tr key={order._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        #{order._id.slice(-8)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">
                                                        {order.user?.name || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        ${order.totalAmount}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'shipped' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">
                                                        {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : 'Not set'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => {/* Handle view order details */}}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4 flex items-center gap-1"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => !updatingOrderId && openStatusModal(order)}
                                                        className="text-green-600 hover:text-green-700 flex items-center gap-1 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                        disabled={!!updatingOrderId}
                                                    >
                                                        {updatingOrderId === order._id ? 'Updating...' : (
                                                            <>
                                                                <CheckCircle className="w-4 h-4" />
                                                                Update Status
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Image Modal */}
            {showImageModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="relative max-w-4xl max-h-full p-4">
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-700" />
                        </button>

                        <div className="bg-white rounded-lg overflow-hidden">
                            <div className="relative">
                                <img
                                    src={URL.createObjectURL(selectedFiles[currentImageIndex])}
                                    alt={`Image ${currentImageIndex + 1}`}
                                    className="max-w-full max-h-96 object-contain mx-auto"
                                />

                                {selectedFiles.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : selectedFiles.length - 1))}
                                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-2 hover:bg-opacity-100 transition-all"
                                        >
                                            <ChevronLeft className="w-6 h-6 text-gray-700" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentImageIndex((prev) => (prev < selectedFiles.length - 1 ? prev + 1 : 0))}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-2 hover:bg-opacity-100 transition-all"
                                        >
                                            <ChevronRight className="w-6 h-6 text-gray-700" />
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="p-4 bg-gray-50">
                                <div className="flex justify-center space-x-2">
                                    {selectedFiles.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`w-3 h-3 rounded-full transition-colors ${index === currentImageIndex ? 'bg-green-500' : 'bg-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-center text-sm text-gray-600 mt-2">
                                    Image {currentImageIndex + 1} of {selectedFiles.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Update Order Status</h3>
                        </div>
                        <form onSubmit={handleStatusSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status *
                                </label>
                                <select
                                    name="status"
                                    value={statusFormData.status}
                                    onChange={handleStatusChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Note
                                </label>
                                <textarea
                                    name="note"
                                    value={statusFormData.note}
                                    onChange={handleStatusChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Add any additional notes..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estimated Delivery Date
                                </label>
                                <input
                                    type="datetime-local"
                                    name="estimatedDelivery"
                                    value={statusFormData.estimatedDelivery}
                                    onChange={handleStatusChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed"
                                    disabled={updatingOrderId === selectedOrder?._id}
                                >
                                    {updatingOrderId === selectedOrder?._id ? 'Updating...' : 'Update Status'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeStatusModal}
                                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default SellerDashboardPage;
