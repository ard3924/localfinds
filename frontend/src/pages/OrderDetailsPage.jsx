import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, MapPin, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft, X, Download, FileText } from 'lucide-react';
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

    const fetchOrderData = async () => {
        setLoading(true);
        setError(null);

        // First, get user role to determine the correct endpoint
        try {
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
                const response = await axiosInstance.get(endpoint);
                if (response.data.success) {
                    setOrder(null); // Reset single order
                    setOrders(response.data.orders);
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
    }, [id]);

    // Check if invoice exists for the order
    useEffect(() => {
        if (order && order.status !== 'cancelled') {
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
            <div className="space-y-4">
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <Truck className="w-5 h-5 mr-2" />
                    Order Tracking
                </h4>
                <div className="space-y-3">
                    {sortedHistory.map((entry, index) => (
                        <div key={index} className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                                {getStatusIcon(entry.status)}
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium capitalize">{entry.status}</span>
                                    <span className="text-sm text-gray-500">
                                        {new Date(entry.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                {entry.note && (
                                    <p className="text-sm text-gray-600 mt-1">{entry.note}</p>
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
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Order Details</h2>
                            <div className="space-y-6">
                                <div className="border-b pb-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-semibold">Order #{order._id.slice(-8)}</h3>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                    </div>
                                    <p className="text-gray-600">Ordered on {new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold mb-3">Items</h4>
                                    <div className="space-y-4">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between border-b pb-4">
                                                <div className="flex items-center">
                                                    <img
                                                        src={item.product.images?.[0]?.url || 'https://picsum.photos/80'}
                                                        alt={item.product.name}
                                                        className="w-16 h-16 object-cover rounded-lg mr-4"
                                                    />
                                                    <div>
                                                        <h5 className="font-semibold">{item.product.name}</h5>
                                                        <p className="text-gray-600">Quantity: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Shipping & Tracking Information */}
                                <div className="border-t pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <h4 className="text-lg font-semibold mb-3 flex items-center">
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
                                                <h4 className="text-lg font-semibold mb-3 flex items-center">
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

                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-lg">Total Amount:</span>
                                        <span className="text-2xl font-bold text-green-600">${order.totalAmount.toFixed(2)}</span>
                                    </div>

                                    {order.orderNotes && (
                                        <div className="mb-6">
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
                                                    disabled={downloadingInvoice || invoiceExists === false}
                                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {downloadingInvoice ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                            Downloading...
                                                        </>
                                                    ) : invoiceExists === false ? (
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
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">My Orders</h2>
                            {orders.length === 0 ? (
                                <p className="text-gray-600">You haven't placed any orders yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map((orderItem) => (
                                        <div key={orderItem._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-lg font-semibold">Order #{orderItem._id.slice(-8)}</h3>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderItem.status)}`}>
                                                    {orderItem.status.charAt(0).toUpperCase() + orderItem.status.slice(1)}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 mb-2">Ordered on {new Date(orderItem.createdAt).toLocaleDateString()}</p>
                                            <p className="font-semibold text-green-600">${orderItem.totalAmount.toFixed(2)}</p>
                                            <p className="text-sm text-gray-600">Est. Delivery: {orderItem.estimatedDelivery ? new Date(orderItem.estimatedDelivery).toLocaleDateString() : 'Not set'}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <button
                                                    onClick={() => navigate(`/orders/${orderItem._id}`)}
                                                    className="text-green-600 hover:text-green-700 font-medium"
                                                >
                                                    View Details →
                                                </button>
                                                {orderItem.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleCancelOrderFromList(orderItem._id)}
                                                        className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded-lg font-medium hover:bg-red-700 transition-colors"
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
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default OrderDetailsPage;
