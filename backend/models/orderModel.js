const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
    },
}, { _id: false });

const trackingHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    note: {
        type: String,
        trim: true,
    },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Total amount cannot be negative'],
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    shippingAddress: {
        type: String,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['cash_on_delivery', 'online_payment'],
        default: 'cash_on_delivery',
    },
    orderNotes: {
        type: String,
        trim: true,
    },
    trackingNumber: {
        type: String,
        trim: true,
    },
    carrier: {
        type: String,
        enum: ['fedex', 'ups', 'usps', 'dhl', 'other'],
        trim: true,
    },
    trackingHistory: [trackingHistorySchema],
    estimatedDelivery: {
        type: Date,
    },
}, { timestamps: true });

// Index for efficient querying
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
