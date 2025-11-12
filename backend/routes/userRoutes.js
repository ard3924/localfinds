const express = require('express');
const router = express.Router();
const { User, Seller, Buyer } = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
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

// Create transporter for email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * @route   POST /api/user/forgot-password
 * @desc    Send password reset OTP via email
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists or not for security
            return res.status(200).json({ message: 'If an account with that email exists, an OTP has been sent.' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

        // Set OTP and expiration (10 minutes)
        user.otp = otpHash;
        user.otpExpires = Date.now() + 600000; // 10 minutes
        await user.save();

        // Send email with OTP
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP',
            html: `
                <h2>Password Reset OTP</h2>
                <p>You requested a password reset for your LocalFinds account.</p>
                <p>Your OTP is: <strong>${otp}</strong></p>
                <p>This OTP will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'If an account with that email exists, an OTP has been sent.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @route   POST /api/user/verify-otp
 * @desc    Verify OTP for password reset
 * @access  Public
 */
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user || !user.otp || !user.otpExpires) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Check if OTP has expired
        if (Date.now() > user.otpExpires) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // Verify OTP
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
        if (otpHash !== user.otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Generate a temporary session token for password reset
        const resetToken = jwt.sign({ id: user.id, purpose: 'password_reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });

        // Clear OTP after successful verification
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'OTP verified successfully', resetToken });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @route   POST /api/user/reset-password
 * @desc    Reset password using verified session token
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
    const { resetToken, password } = req.body;

    if (!resetToken || !password) {
        return res.status(400).json({ message: 'Reset token and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    try {
        // Verify the reset token
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (decoded.purpose !== 'password_reset') {
            return res.status(400).json({ message: 'Invalid reset token' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully' });

    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @route   PUT /api/user/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.put('/change-password', protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    try {
        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password using base User model
        await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

        res.status(200).json({ message: 'Password has been changed successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
