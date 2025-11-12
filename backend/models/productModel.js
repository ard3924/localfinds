const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter product name'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please enter product description'],
    },
    price: {
        type: Number,
        required: [true, 'Please enter product price'],
        maxLength: [8, 'Price cannot exceed 8 characters'],
    },
    originalPrice: {
        type: Number,
        default: null,
    },
    discountPercentage: {
        type: Number,
        min: [0, 'Discount percentage cannot be negative'],
        max: [100, 'Discount percentage cannot exceed 100'],
        default: 0,
    },
    discountStartDate: {
        type: Date,
        default: null,
    },
    discountEndDate: {
        type: Date,
        default: null,
    },
    images: [{
        url: { type: String, required: true },
        public_id: { type: String, required: true }
    }],
    category: {
        type: String,
        required: [true, 'Please enter product category'],
    },
    tagline: {
        type: String,
        trim: true,
        maxlength: [100, 'Tagline cannot exceed 100 characters'],
        default: '',
    },
    seller: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    views: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
