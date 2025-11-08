const express = require('express');
const router = express.Router();
const { User, Seller, Buyer, Admin } = require('../models/userModel');
const Product = require('../models/productModel');
const Inquiry = require('../models/inquiryModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { protect, adminOnly } = require('../middleware/authMiddleware');


router.post('/register', protect, adminOnly, async (req, res) => {
    const { name, email, password, phone, address, pinCode } = req.body;

    if (!name || !email || !password || !phone || !address || !pinCode) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        let existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new Admin({
            name,
            email,
            phone,
            address,
            pinCode,
            password: hashedPassword,
            role: 'admin'
        });

        await admin.save();

        res.status(201).json({ message: 'Admin created successfully', adminId: admin.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (buyers, sellers, admins)
 * @access  Private (Admins only)
 */
router.get('/users', protect, adminOnly, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, count: users.length, users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/admin/products
 * @desc    Get all products
 * @access  Private (Admins only)
 */
router.get('/products', protect, adminOnly, async (req, res) => {
    try {
        const products = await Product.find();
        res.json({ success: true, count: products.length, products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   DELETE /api/admin/user/:id
 * @desc    Delete a user by ID
 * @access  Private (Admins only)
 */
router.delete('/user/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   DELETE /api/admin/product/:id
 * @desc    Delete a product by ID
 * @access  Private (Admins only)
 */
router.delete('/product/:id', protect, adminOnly, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/admin/inquiries
 * @desc    Get all inquiries
 * @access  Private (Admins only)
 */
router.get('/inquiries', protect, adminOnly, async (req, res) => {
    try {
        const inquiries = await Inquiry.find().sort({ createdAt: -1 });
        res.json({ success: true, count: inquiries.length, inquiries });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/admin/inquiry/:id
 * @desc    Get a single inquiry by ID
 * @access  Private (Admins only)
 */
router.get('/inquiry/:id', protect, adminOnly, async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id);
        if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

        res.json({ success: true, inquiry });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   PUT /api/admin/inquiry/:id
 * @desc    Update inquiry status and response
 * @access  Private (Admins only)
 */
router.put('/inquiry/:id', protect, adminOnly, async (req, res) => {
    try {
        const { status, priority, response } = req.body;
        const updateData = {};

        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;
        if (response) {
            updateData.response = response;
            updateData.respondedAt = new Date();
        }

        const inquiry = await Inquiry.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

        res.json({ success: true, message: 'Inquiry updated successfully', inquiry });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   DELETE /api/admin/inquiry/:id
 * @desc    Delete an inquiry by ID
 * @access  Private (Admins only)
 */
router.delete('/inquiry/:id', protect, adminOnly, async (req, res) => {
    try {
        const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
        if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

        res.json({ success: true, message: 'Inquiry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
