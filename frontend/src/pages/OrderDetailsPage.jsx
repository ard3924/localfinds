import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, MapPin, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft, X, Download, FileText, Package, Calendar, DollarSign } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import AccountSidebar from '../components/AccountSidebar.jsx';
import axiosInstance from '../axiosintreceptor.js';
import toast from 'react-hot-toast';

const OrderDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [downloadingInvoice, setDownloadingInvoice] = useState(false);
    const [invoiceExists, setInvoiceExists] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const ordersPerPage = 6;

    const fetchOrderData = async (page = 1) => {
        setLoading(true);
        setError(null);

        // First, get user role to determine the correct endpoint
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const userResponse = await axiosInstance.get('/user/account');
            setUserRole(userResponse.data.role);
        } catch (err) {
            console.error('Error fetching user:', err);
            setError('Failed to authenticate user');
            toast.error('Failed to authenticate user');
            setLoading(false);
            return;
        }

        if (!id) {
            // If no ID, fetch all orders based on role
            try {
                const endpoint = userRole === 'seller' ? '/orders/seller' : '/orders/myorders';
                const response = await axiosInstance.get(`${endpoint}?page=${page}&limit=${ordersPerPage}`);
                if (response.data.success) {
                    setOrder(null); // Reset single order
                    setOrders(response.data.orders);
                    setTotalPages(response.data.pagination.totalPages);
                    setCurrentPage(response.data.pagination.currentPage);
                    setTotalOrders(response.data.totalOrders);
                } else {
                    throw new Error('Failed to fetch orders');
                }
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError('Failed to load orders');
                toast.error('Failed to load orders');
            }
        } else {
            // If ID, fetch single order
            try {
                const response = await axiosInstance.get(`/orders/${id}`);
                if (response.data.success) {
                    setOrder(response.data.order);
                } else {
                    throw new Error('Failed to fetch order');
                }
            } catch (err) {
                console.error('Error fetching order:', err);
                setError('Failed to load order details');
                toast.error('Failed to load order details');
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrderData();
    }, [id, userRole]);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        fetchOrderData(newPage);
    };
    // Check if invoice exists for the order
    useEffect(() => {
        if (order && order.status !== 'cancelled' && id) {
            let pollingInterval;
            let timeoutId;

            const checkInvoiceExists = async () => {
                try {
                    const response = await axiosInstance.get(`/invoices/order/${id}`);
                    setInvoiceExists(true);
                    // Stop polling once invoice is found
                    if (pollingInterval) clearInterval(pollingInterval);
                    if (timeoutId) clearTimeout(timeoutId);
                } catch (err) {
                    setInvoiceExists(false);
                }
            };

            // Initial check
            checkInvoiceExists();

            // Poll every 3 seconds for up to 30 seconds
            pollingInterval = setInterval(checkInvoiceExists, 3000);

            // Stop polling after 30 seconds
            timeoutId = setTimeout(() => {
                if (pollingInterval) clearInterval(pollingInterval);
            }, 30000);

            return () => {
                if (pollingInterval) clearInterval(pollingInterval);
                if (timeoutId) clearTimeout(timeoutId);
            };
        } else {
            setInvoiceExists(null);
        }
    }, [order, id]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'shipped': return 'bg-purple-100 text-purple-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <AlertCircle className="w-5 h-5" />;
            case 'confirmed': return <CheckCircle className="w-5 h-5" />;
            case 'shipped': return <Truck className="w-5 h-5" />;
            case 'delivered': return <CheckCircle className="w-5 h-5" />;
            case 'cancelled': return <XCircle className="w-5 h-5" />;
            default: return <Clock className="w-5 h-5" />;
        }
    };

    const getCarrierName = (carrier) => {
        switch (carrier) {
            case 'fedex': return 'FedEx';
            case 'ups': return 'UPS';
            case 'usps': return 'USPS';
            case 'dhl': return 'DHL';
            case 'other': return 'Other Carrier';
            default: return carrier || 'Not specified';
        }
    };

    const handleCancelOrder = async () => {
        setCancelling(true);
        try {
            const response = await axiosInstance.delete(`/orders/${id}`);
            if (response.data.success) {
                toast.success('Order cancelled successfully');
                // Refresh the order data
                const updatedResponse = await axiosInstance.get(`/orders/${id}`);
                if (updatedResponse.data.success) {
                    setOrder(updatedResponse.data.order);
                }
            } else {
                throw new Error('Failed to cancel order');
            }
        } catch (err) {
            console.error('Error cancelling order:', err);
            toast.error(err.response?.data?.message || 'Failed to cancel order');
        } finally {
            setCancelling(false);
        }
    };

    const handleCancelOrderFromList = async (orderId) => {
        try {
            const response = await axiosInstance.delete(`/orders/${orderId}`);
            if (response.data.success) {
                toast.success('Order cancelled successfully');
                // Refresh the orders list
                fetchOrderData();
            } else {
                throw new Error('Failed to cancel order');
            }
        } catch (err) {
            console.error('Error cancelling order:', err);
            toast.error(err.response?.data?.message || 'Failed to cancel order');
        }
    };

    const handleDownloadInvoice = async () => {
        setDownloadingInvoice(true);
        try {
            // First, get the invoice data to obtain the invoice number
            const invoiceResponse = await axiosInstance.get(`/invoices/order/${id}`);
            if (!invoiceResponse.data.success) {
                throw new Error('Invoice not found');
            }

            const invoiceNumber = invoiceResponse.data.invoice.invoiceNumber;

            // Now download the PDF using the invoice number
            const response = await axiosInstance.get(`/invoices/download/${invoiceNumber}`, {
                responseType: 'blob', // Important for downloading files
            });

            // Create a blob URL and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice_${invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Invoice downloaded successfully');
        } catch (err) {
            console.error('Error downloading invoice:', err);
            if (err.response?.status === 404) {
                toast.error('Invoice not available yet. Please try again later.');
            } else {
                toast.error(err.response?.data?.message || 'Failed to download invoice');
            }
        } finally {
            setDownloadingInvoice(false);
        }
    };

    const TrackingTimeline = ({ trackingHistory }) => {
        const sortedHistory = [...trackingHistory].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return (
            <div className="bg-gray-50 p-6 rounded-lg mt-6">
                <h4 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                    <Truck className="w-5 h-5 mr-2" />
                    Order Tracking
                </h4>
                <div className="space-y-3">
                    {sortedHistory.map((entry, index) => (
                        <div key={index} className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(entry.status)}`}>
                                    {getStatusIcon(entry.status)}
                                </div>
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold capitalize text-gray-800">{entry.status}</span>
                                    <span className="text-sm text-gray-500">
                                        {new Date(entry.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                {entry.note && (
                                    <p className="text-sm text-gray-600 mt-1 italic">"{entry.note}"</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <main className="w-full max-w-7xl mx-auto px-4 py-8 pt-24 flex-grow grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <AccountSidebar />
                    <div className="lg:col-span-3 bg-white p-8 rounded-xl shadow-lg flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading...</p>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <main className="w-full max-w-7xl mx-auto px-4 py-8 pt-24 flex-grow grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <AccountSidebar />
                    <div className="lg:col-span-3 bg-white p-8 rounded-xl shadow-lg flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-green-500 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-600"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="w-full max-w-7xl mx-auto px-4 py-8 pt-24 flex-grow grid grid-cols-1 lg:grid-cols-4 gap-8">
                <AccountSidebar />
                {/* Main Content Area */}
                <div className="lg:col-span-3 bg-white p-8 rounded-xl shadow-lg">
                    {id && order ? (
                        <>
                            <div className="mb-6">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="inline-flex items-center text-green-600 hover:text-green-700 font-medium transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 mr-2" />
                                    Back to Orders
                                </button>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Details</h2>
                            <p className="text-gray-500 mb-6">Review the status and details of your order.</p>
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                                    <h3 className="text-xl font-semibold text-gray-800">Order #{order._id.slice(-8)}</h3>
                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </div>
                                    <p className="text-gray-600">Ordered on {new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>

                                <div>
                                    <h4 className="text-xl font-semibold mb-3 text-gray-800">Items Ordered ({order.items.length})</h4>
                                    <div className="space-y-4">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between border-b pb-3">
                                                <div className="flex items-center">
                                                    <img
                                                        src={item.product.images?.[0]?.url || 'https://picsum.photos/80'}
                                                        alt={item.product.name}
                                                        className="w-16 h-16 object-cover rounded-lg mr-4"
                                                    />
                                                    <div>
                                                        <h5 className="font-semibold text-gray-800">{item.product.name}</h5>
                                                        <p className="text-gray-600">Quantity: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <p className="font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Shipping & Tracking Information */}
                                <div className="border-t pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <h4 className="text-xl font-semibold mb-3 flex items-center text-gray-800">
                                                <MapPin className="w-5 h-5 mr-2" />
                                                Shipping Information
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Address:</span>
                                                    <span className="text-right max-w-xs text-sm">{order.shippingAddress}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Payment:</span>
                                                    <span className="text-sm">{order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Est. Delivery:</span>
                                                    <span className="text-sm font-medium text-green-600">
                                                        {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : 'Not set'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {order.trackingNumber && (
                                            <div>
                                                <h4 className="text-xl font-semibold mb-3 flex items-center text-gray-800">
                                                    <Truck className="w-5 h-5 mr-2" />
                                                    Tracking Information
                                                </h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Carrier:</span>
                                                        <span className="text-sm font-medium">{getCarrierName(order.carrier)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Tracking #:</span>
                                                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                                            {order.trackingNumber}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end items-center mb-4">
                                        <span className="text-lg text-gray-700 mr-4">Total Amount:</span>
                                        <span className="text-2xl font-bold text-green-600">${order.totalAmount.toFixed(2)}</span>
                                    </div>

                                    {order.orderNotes && (
                                        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                                            <span className="font-medium">Order Notes:</span>
                                            <p className="text-gray-600 mt-1">{order.orderNotes}</p>
                                        </div>
                                    )}

                                    {/* Order Actions */}
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center">
                                            {/* Invoice Download Button */}
                                            {invoiceExists !== null && (
                                                <button
                                                    onClick={handleDownloadInvoice}
                                                    disabled={downloadingInvoice || !invoiceExists}
                                                    className="relative inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors overflow-hidden"
                                                >
                                                    {downloadingInvoice && (
                                                        <div className="absolute top-0 left-0 h-full bg-blue-700 animate-pulse" style={{ width: '100%' }}></div>
                                                    )}
                                                    <span className="relative z-10 flex items-center" />
                                                    {downloadingInvoice ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                            Downloading...
                                                        </>
                                                    ) : !invoiceExists ? (
                                                        <>
                                                            <FileText className="w-4 h-4 mr-2" />
                                                            Invoice Not Ready
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Download Invoice
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {/* Cancel Order Button */}
                                            {order.status === 'pending' && (
                                                <button
                                                    onClick={handleCancelOrder}
                                                    disabled={cancelling}
                                                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {cancelling ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                            Cancelling...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <X className="w-4 h-4 mr-2" />
                                                            Cancel Order
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tracking Timeline */}
                                    {order.trackingHistory && order.trackingHistory.length > 0 && (
                                        <TrackingTimeline trackingHistory={order.trackingHistory} />
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h2>
                            <p className="text-gray-500 mb-6">Track and manage all your past and current orders.</p>
                            {orders.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-xl text-gray-600 mb-4">You haven't placed any orders yet.</p>
                                    <button onClick={() => navigate('/marketplace')} className="bg-green-500 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-600 transition-colors">
                                        Start Shopping
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {orders.map((orderItem) => (
                                        <div key={orderItem._id} className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow bg-white">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800">Order #{orderItem._id.slice(-8)}</h3>
                                                    <div className="flex items-center text-sm text-gray-500 mt-1">
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        <span>{new Date(orderItem.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderItem.status)}`}>
                                                    {getStatusIcon(orderItem.status)}
                                                    <span>{orderItem.status.charAt(0).toUpperCase() + orderItem.status.slice(1)}</span>
                                                </div>
                                            </div>
                                            {orderItem.items && orderItem.items.length > 0 && orderItem.items[0].product && (
                                                <div className="flex items-center mb-3">
                                                    <img
                                                        src={orderItem.items[0].product.images?.[0]?.url || 'https://picsum.photos/80'}
                                                        alt={orderItem.items[0].product.name}
                                                        className="w-12 h-12 object-cover rounded-lg mr-3"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-gray-800">{orderItem.items[0].product.name}</p>
                                                        {orderItem.items.length > 1 && (
                                                            <p className="text-sm text-gray-500">+{orderItem.items.length - 1} more item(s)</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center text-lg font-bold text-green-600 my-4">
                                                <DollarSign className="w-5 h-5 mr-2" />
                                                <span>{orderItem.totalAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                                <button
                                                    onClick={() => navigate(`/orders/${orderItem._id}`)}
                                                    className="text-green-600 hover:underline font-medium"
                                                >
                                                    View Details →
                                                </button>
                                                {orderItem.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleCancelOrderFromList(orderItem._id)}
                                                        className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg font-medium hover:bg-red-200 transition-colors"
                                                    >
                                                        <X className="w-4 h-4 mr-1" />
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {orders.length > 0 && totalPages > 1 && (
                                <div className="mt-8 flex justify-center items-center space-x-4">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-gray-600">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                            {orders.length > 0 && (
                                <div className="mt-4 text-center text-sm text-gray-500">
                                    Showing {orders.length} of {totalOrders} orders
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main >
            <Footer />
        </div >
    );
};

export default OrderDetailsPage;
