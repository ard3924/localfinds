const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true, // One invoice per order
    },
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
        name: String,
        quantity: Number,
        price: Number,
        total: Number,
    }],
    subtotal: {
        type: Number,
        required: true,
    },
    tax: {
        type: Number,
        default: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    shippingAddress: {
        type: String,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['cash_on_delivery', 'online_payment'],
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'cancelled'],
        default: 'active',
    },
    pdfPath: {
        type: String,
        required: true,
    },
    generatedAt: {
        type: Date,
        default: Date.now,
    },
    cancelledAt: {
        type: Date,
    },
}, { timestamps: true });

// Index for efficient querying
invoiceSchema.index({ user: 1 });
invoiceSchema.index({ seller: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
