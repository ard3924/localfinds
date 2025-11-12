import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Upload, X, ChevronLeft, ChevronRight, Truck, Eye, CheckCircle, Clock, AlertCircle, Search } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import axiosInstance from '../axiosintreceptor.js';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce.js';

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
        tagline: '',
        discountPercentage: '',
        discountStartDate: '',
        discountEndDate: '',
        images: []
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [combinedImages, setCombinedImages] = useState([]);
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
    const [ordersCurrentPage, setOrdersCurrentPage] = useState(1);
    const [ordersTotalPages, setOrdersTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [orderSortBy, setOrderSortBy] = useState('dateDesc');
    const ordersPerPage = 10;
    const [productsTotalPages, setProductsTotalPages] = useState(1);
    const productsPerPage = 8;
    const [productSortBy, setProductSortBy] = useState('dateDesc');
    const [productsCurrentPage, setProductsCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        if (activeTab === 'products') {
            fetchProducts();
        } else if (activeTab === 'orders') {
            fetchOrders(1, orderSortBy);
        }
    }, [activeTab, orderSortBy]);

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

    const fetchOrders = async (page = 1, sortBy = 'dateDesc') => {
        try {
            const response = await axiosInstance.get(`/orders/seller?page=${page}&limit=${ordersPerPage}&sortBy=${sortBy}`);
            setOrders(response.data.orders);
            setOrdersCurrentPage(response.data.pagination.currentPage);
            setOrdersTotalPages(response.data.pagination.totalPages);
            setTotalOrders(response.data.totalOrders);
        } catch (error) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleOrderPageChange = (newPage) => {
        if (newPage < 1 || newPage > ordersTotalPages) return;
        fetchOrders(newPage, orderSortBy);
    };

    const handleSortChange = (e) => {
        const newSortBy = e.target.value;
        setOrderSortBy(newSortBy);
    };

    const processTagline = (value) => {
        // Split by commas and trim
        const sentences = value.split(',').map(s => s.trim());
        // For each sentence, limit to 3 words
        const processed = sentences.map(sentence => {
            const words = sentence.split(/\s+/).filter(w => w.length > 0);
            return words.slice(0, 3).join(' ');
        });
        // Join back with commas
        let result = processed.join(', ');
        // Truncate if > 100 chars
        if (result.length > 100) {
            result = result.substring(0, 97) + '...';
        }
        return result;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        if (name === 'tagline') {
            processedValue = processTagline(value);
        }
        setFormData(prev => ({
            ...prev,
            [name]: processedValue
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
            tagline: '',
            discountPercentage: '',
            discountStartDate: '',
            discountEndDate: '',
            images: []
        });
        setSelectedFiles([]);
        setExistingImages([]);
        setImagesToDelete([]);
        setEditingProduct(null);
        setShowAddForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

    // Combine existing and new images
    const combinedImages = [
        ...existingImages.map(img => ({ type: 'existing', data: img })),
        ...selectedFiles.map(file => ({ type: 'new', data: file }))
    ];

    setIsSubmitting(true);

        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('price', formData.price);
        formDataToSend.append('category', formData.category);

        // Add tagline if provided
        if (formData.tagline) {
            formDataToSend.append('tagline', formData.tagline);
        }

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

        // Send images in the combined order
        const existingImagesUrls = combinedImages.filter(img => img.type === 'existing').map(img => img.data.url);
        const newFiles = combinedImages.filter(img => img.type === 'new').map(img => img.data);

        existingImagesUrls.forEach((url) => {
            formDataToSend.append('existingImages', url);
        });
        newFiles.forEach((file) => {
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
            tagline: product.tagline || '',
            discountPercentage: product.discountPercentage ? product.discountPercentage.toString() : '',
            discountStartDate: product.discountStartDate ? new Date(product.discountStartDate).toISOString().slice(0, 16) : '',
            discountEndDate: product.discountEndDate ? new Date(product.discountEndDate).toISOString().slice(0, 16) : '',
            images: product.images.length > 0 ? product.images : [{ url: '' }]
        });
        setExistingImages(product.images || []);
        setShowAddForm(true);
    };

    const handleDelete = async (productId) => {
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

    const filteredProducts = products.filter(product => {
        if (!debouncedSearchTerm.trim()) {
            return true;
        }
        const lowercasedTerm = debouncedSearchTerm.toLowerCase();
        return (
            product.name.toLowerCase().includes(lowercasedTerm) ||
            product.description.toLowerCase().includes(lowercasedTerm)
        );
    });

    useEffect(() => {
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        setProductsTotalPages(totalPages > 0 ? totalPages : 1);
        if (productsCurrentPage > totalPages && totalPages > 0) {
            setProductsCurrentPage(totalPages);
        }
    }, [filteredProducts.length, productsPerPage, productsCurrentPage]);

    const handleProductPageChange = (newPage) => {
        if (newPage < 1 || newPage > productsTotalPages) return;
        setProductsCurrentPage(newPage);
    };

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (productSortBy) {
            case 'priceAsc':
                return a.price - b.price;
            case 'priceDesc':
                return b.price - a.price;
            case 'nameAsc':
                return a.name.localeCompare(b.name);
            case 'nameDesc':
                return b.name.localeCompare(a.name);
            case 'dateAsc':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'dateDesc':
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    const paginatedProducts = sortedProducts.slice(
        (productsCurrentPage - 1) * productsPerPage,
        productsCurrentPage * productsPerPage
    );

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
                            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                                    <div className="flex justify-between items-center p-6 border-b">
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                                        </h2>
                                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <form id="add-product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                                            <input
                                                type="text"
                                                name="tagline"
                                                value={formData.tagline}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                                placeholder="Enter taglines separated by commas, each with max 3 words (max 100 characters)"
                                                maxLength="100"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                rows="4"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
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
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage (%)</label>
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
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Start Date</label>
                                                <input
                                                    type="datetime-local"
                                                    name="discountStartDate"
                                                    value={formData.discountStartDate}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Discount End Date</label>
                                                <input
                                                    type="datetime-local"
                                                    name="discountEndDate"
                                                    value={formData.discountEndDate}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Product Images *</label>
                                            {editingProduct && existingImages.length > 0 && (
                                                <div className="mb-4">
                                                    <p className="text-sm text-gray-600 mb-2">Existing Images:</p>
                                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                                                        {existingImages.map((image, index) => (
                                                            <div key={index} className="relative group">
                                                                <img src={image.url} alt={`Existing ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setExistingImages(existingImages.filter((_, i) => i !== index))}
                                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    title="Remove this image"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div
                                                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400'}`}
                                                onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
                                            >
                                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                <label htmlFor="file-upload" className="cursor-pointer mt-2 block text-sm font-medium text-green-600 hover:text-green-500">
                                                    Upload files <span className="text-gray-500">or drag and drop</span>
                                                    <input id="file-upload" name="images" type="file" multiple accept="image/*" onChange={(e) => { addFiles(e.target.files); e.target.value = null; }} className="sr-only" />
                                                </label>
                                                <p className="mt-1 text-xs text-gray-500"> (max 5 images)</p>
                                            </div>
                                            {selectedFiles.length > 0 && (
                                                <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-4">
                                                    {selectedFiles.map((file, index) => (
                                                        <div key={index} className="relative group">
                                                            <img src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                                                            <button type="button" onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </form>
                                    <div className="flex gap-4 p-6 border-t bg-gray-50 rounded-b-xl">
                                        <button type="button" onClick={resetForm} className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-300" disabled={isSubmitting}>
                                            Cancel
                                        </button>
                                        <button type="submit" form="add-product-form" className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed" disabled={isSubmitting}>
                                            {isSubmitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Products List */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <h2 className="text-xl font-semibold">Your Products ({filteredProducts.length})</h2>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search products..."
                                            className="w-full py-2 pl-10 pr-4 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 shadow-inner"
                                        />
                                    </div>
                                    <select
                                        value={productSortBy}
                                        onChange={(e) => setProductSortBy(e.target.value)}
                                        className="w-full sm:w-auto py-2 pl-3 pr-8 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 shadow-inner"
                                    >
                                        <option value="dateDesc">Newest First</option>
                                        <option value="dateAsc">Oldest First</option>
                                        <option value="priceDesc">Price: High to Low</option>
                                        <option value="priceAsc">Price: Low to High</option>
                                        <option value="nameAsc">Name (A-Z)</option>
                                        <option value="nameDesc">Name (Z-A)</option>
                                    </select>
                                </div>
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
                                paginatedProducts.length === 0 && searchTerm ? (
                                    <div className="p-8 text-center text-gray-600">
                                        No products match your search.
                                    </div>
                                ) : (
                                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {paginatedProducts.map((product) => (
                                        <div key={product._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col">
                                            <div className="aspect-w-16 aspect-h-9">
                                                {product.images && product.images.length > 0 ? (
                                                    <img
                                                        className="w-full h-40 object-cover"
                                                        src={product.images[0].url}
                                                        alt={product.name}
                                    />
                                                ) : (
                                                    <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                                                        <Package className="w-10 h-10 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 flex flex-col flex-grow">
                                                <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                                                <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                                                {product.tagline && <p className="text-sm text-gray-600 mb-1">{product.tagline.split(',').map(s => s.trim()).join(' | ')}</p>}
                                                <p className="text-sm text-gray-600 line-clamp-2 flex-grow">{product.description}</p>
                                                <div className="mt-4 flex justify-between items-center">
                                                    {product.originalPrice && product.originalPrice > product.price ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-gray-500 line-through">
                                                                ${product.originalPrice}
                                                            </span>
                                                            <span className="text-xl font-bold text-green-600">
                                                                ${product.price}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xl font-bold text-green-600">
                                                            ${product.price}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => !deletingProductId && handleEdit(product)}
                                                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium flex items-center gap-1 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                    disabled={!!deletingProductId}
                                                    title="Edit Product"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product._id)}
                                                    className="text-red-600 hover:text-red-900 text-sm font-medium flex items-center gap-1 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                    disabled={!!deletingProductId}
                                                    title="Delete Product"
                                                >
                                                    {deletingProductId === product._id ? (
                                                        'Deleting...'
                                                    ) : (
                                                        <>
                                                            <Trash2 className="w-4 h-4" />
                                                            <span>Delete</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                )
                            )}
                            {filteredProducts.length > productsPerPage && (
                                <div className="px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="text-sm text-gray-600">
                                        Showing <span className="font-semibold">{paginatedProducts.length}</span> of <span className="font-semibold">{filteredProducts.length}</span> products
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleProductPageChange(productsCurrentPage - 1)}
                                            disabled={productsCurrentPage === 1}
                                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-gray-600 text-sm">
                                            Page {productsCurrentPage} of {productsTotalPages}
                                        </span>
                                        <button
                                            onClick={() => handleProductPageChange(productsCurrentPage + 1)}
                                            disabled={productsCurrentPage === productsTotalPages}
                                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'orders' && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Your Orders ({totalOrders})</h2>
                            <div className="flex items-center gap-2">
                                <label htmlFor="sort-orders" className="text-sm font-medium text-gray-700">Sort by:</label>
                                <select
                                    id="sort-orders"
                                    value={orderSortBy}
                                    onChange={handleSortChange}
                                    className="appearance-none bg-white border border-gray-300 text-gray-700 py-1 pl-2 pr-8 rounded-lg text-sm leading-tight focus:outline-none focus:bg-white focus:border-green-500"
                                >
                                    <option value="dateDesc">Newest First</option>
                                    <option value="dateAsc">Oldest First</option>
                                    <option value="totalDesc">Total: High to Low</option>
                                    <option value="totalAsc">Total: Low to High</option>
                                    <option value="statusPriority">Status Priority</option>
                                </select>
                            </div>
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
                                                Products
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Items
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
                                                Est. Delivery
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {orders.map((order) => (
                                            <tr key={order._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <a
                                                        href={`/orders/${order._id}`} // Link to the order detail page
                                                        className="text-green-600 hover:text-green-800 hover:underline"
                                                    >
                                                        #{order._id.slice(-8)}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">
                                                        {order.user?.name || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">
                                                        {order.items?.map(item => item.product?.name).join(', ') || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">
                                                        {order.items?.length || 0}
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
                                                        onClick={() => !updatingOrderId && openStatusModal(order)}
                                                        className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                        disabled={!!updatingOrderId}
                                                        title="Edit Status"
                                                    >
                                                        {updatingOrderId === order._id ? 'Updating...' : 'Edit Status'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {orders.length > 0 && ordersTotalPages > 1 && (
                            <div className="mt-6 px-6 py-4 flex justify-between items-center border-t">
                                <span className="text-sm text-gray-600">
                                    Showing {orders.length} of {totalOrders} orders
                                </span>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleOrderPageChange(ordersCurrentPage - 1)}
                                        disabled={ordersCurrentPage === 1}
                                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-gray-600 text-sm">
                                        Page {ordersCurrentPage} of {ordersTotalPages}
                                    </span>
                                    <button
                                        onClick={() => handleOrderPageChange(ordersCurrentPage + 1)}
                                        disabled={ordersCurrentPage === ordersTotalPages}
                                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
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
