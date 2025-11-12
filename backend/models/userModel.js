const mongoose = require('mongoose');

// Options for the discriminator key
const baseOptions = {
    discriminatorKey: 'role', // our discriminator key
    collection: 'users', // the name of our collection
    timestamps: true, // Automatically add createdAt and updatedAt fields
};

// --- Base User Schema with common fields ---
const baseUserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false // Do not return password on queries by default
    },
    profilePhoto: {
        public_id: { type: String, default: null },
        url: { type: String, default: null }
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    pinCode: {
        type: String,
        required: true,
        trim: true
    },
    wishlist: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        addedAt: { type: Date, default: Date.now }
    }],
    viewedCategories: [{
        category: { type: String, required: true },
        count: { type: Number, default: 1 }
    }],
    purchasedCategories: [{
        category: { type: String, required: true },
        count: { type: Number, default: 1 }
    }],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    otp: { type: String },
    otpExpires: { type: Date }
}, baseOptions);

const User = mongoose.model('User', baseUserSchema);

// --- Seller Schema (inherits from Base) ---
const sellerSchema = new mongoose.Schema({
    businessName: { type: String, trim: true },
    businessCategory: { type: [String] },
    bio: { type: String }
});

const Seller = User.discriminator('seller', sellerSchema);

// --- Buyer Schema (inherits from Base) ---
const buyerSchema = new mongoose.Schema({
    preferredProducts: { type: [String] }
});

const Buyer = User.discriminator('buyer', buyerSchema);

// --- Admin Schema (inherits from Base) ---
const adminSchema = new mongoose.Schema({});

const Admin = User.discriminator('admin', adminSchema);

module.exports = { User, Seller, Buyer, Admin };
