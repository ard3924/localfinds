const jwt = require('jsonwebtoken');
const { User } = require('../models/userModel');

// Middleware to protect routes
const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Add user from payload
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Middleware to restrict access to sellers only
const sellerOnly = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (user && user.role === 'seller') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Sellers only.' });
    }
};

// Middleware to restrict access to admins only
const adminOnly = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (user && user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admins only.' });
    }
};

module.exports = { protect, sellerOnly, adminOnly };
