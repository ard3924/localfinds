const express = require('express');
const router = express.Router();
const { User, Seller, Buyer } = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect, sellerOnly } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/user/register
 * @desc    Register a new user (buyer or seller)
 * @access  Public
 */
router.post('/register', async (req, res) => {
    const { name, email, password, role, phone, address, pinCode, ...otherFields } = req.body;

    if (!name || !email || !password || !role || !phone || !address || !pinCode) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!['buyer', 'seller'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified.' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = {
            name,
            email,
            phone,
            address,
            pinCode,
            password: hashedPassword,
        };

        if (role === 'seller') {
            const sellerData = {
                ...userData,
                businessName: otherFields.businessName,
                businessCategory: otherFields.businessCategory ? otherFields.businessCategory.split(',').map(c => c.trim()) : [],
                bio: otherFields.bio
            };
            user = new Seller(sellerData);
        } else {
            const buyerData = {
                ...userData,
                preferredProducts: otherFields.preferredProducts ? otherFields.preferredProducts.split(',').map(p => p.trim()) : []
            };
            user = new Buyer(buyerData);
        }

        await user.save();

        res.status(201).json({ message: 'User registered successfully', userId: user.id });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @route   POST /api/user/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = {
            id: user.id,
            name: user.name,
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({
            message: 'Login successful',
            token: token
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @route   GET /api/users/account
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/account', protect, async (req, res) => {
    try {
        // req.user.id is set by the 'protect' middleware from the token
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/users/account
 * @desc    Update user profile information
 * @access  Private
 */
router.put('/account', protect, async (req, res) => {
    const userId = req.user.id;
    const { name, phone, address, pinCode, businessName, businessCategory, bio } = req.body;

    try {
        // First, find the user to determine their role
        const baseUser = await User.findById(userId);
        if (!baseUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        let user;
        if (baseUser.role === 'seller') {
            user = await Seller.findById(userId);
        } else {
            user = await Buyer.findById(userId);
        }

        if (!user) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        // Update common fields
        user.name = name || user.name;
        user.phone = phone || user.phone;
        user.address = address || user.address;
        user.pinCode = pinCode || user.pinCode;

        // Update role-specific fields
        if (baseUser.role === 'seller') {
            user.businessName = businessName || user.businessName;
            user.businessCategory = businessCategory ? businessCategory.split(',').map(c => c.trim()) : user.businessCategory;
            user.bio = bio || user.bio;
        }

        const updatedUser = await user.save();

        res.json(updatedUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/user/wishlist
 * @desc    Add product to user's wishlist
 * @access  Private
 */
router.post('/wishlist', protect, async (req, res) => {
    const { productId } = req.body;

    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if product is already in wishlist
        const existingItem = user.wishlist.find(item => item.product.toString() === productId);
        if (existingItem) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }

        user.wishlist.push({ product: productId });
        await user.save();

        res.json({ message: 'Product added to wishlist', wishlist: user.wishlist });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE /api/user/wishlist/:productId
 * @desc    Remove product from user's wishlist
 * @access  Private
 */
router.delete('/wishlist/:productId', protect, async (req, res) => {
    const { productId } = req.params;

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.wishlist = user.wishlist.filter(item => item.product.toString() !== productId);
        await user.save();

        res.json({ message: 'Product removed from wishlist', wishlist: user.wishlist });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/user/wishlist
 * @desc    Get user's wishlist with populated product details
 * @access  Private
 */
router.get('/wishlist', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'wishlist.product',
            model: 'Product'
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ wishlist: user.wishlist });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;