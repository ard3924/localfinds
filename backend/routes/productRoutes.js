const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');

// Import middleware
const { protect, sellerOnly } = require('../middleware/authMiddleware');
const { upload, cloudinary } = require('../middleware/uploadMiddleware');

/**
 * Processes product data from the request for both creation and updates.
 * Handles image processing, discount logic, and data structuring.
 * @param {import('express').Request} req - The Express request object.
 * @returns {Object} The processed product data ready for database insertion/update.
 */
const processProductData = (req) => {
    const { name, description, price, category, discountPercentage, discountStartDate, discountEndDate, existingImages } = req.body;

    // --- Image Processing ---
    const newImages = req.files ? req.files.map(file => ({ url: file.path, public_id: file.filename })) : [];
    let allImages = [];

    if (req.product) { // Update logic
        let keptImages = [];
        if (existingImages) {
            const imagesToKeep = Array.isArray(existingImages) ? existingImages : [existingImages];
            keptImages = req.product.images.filter(img => imagesToKeep.includes(img.url));
        }

        const imagesToDelete = req.product.images.filter(originalImage =>
            !keptImages.some(keptImage => keptImage.public_id === originalImage.public_id)
        );

        if (imagesToDelete.length > 0) {
            const publicIdsToDelete = imagesToDelete.map(img => img.public_id);
            cloudinary.api.delete_resources(publicIdsToDelete, (error) => {
                if (error) console.error('Error deleting old images from Cloudinary:', error);
            });
        }
        allImages = [...keptImages, ...newImages];
    } else { // Create logic
        allImages = newImages;
    }

    if (allImages.length === 0) {
        const err = new Error('A product must have at least one image.');
        err.status = 400;
        throw err;
    }

    const productData = { ...req.body, images: allImages };

    // --- Discount Logic ---
    const originalPrice = parseFloat(price);
    productData.originalPrice = originalPrice;

    if (discountPercentage && parseFloat(discountPercentage) > 0) {
        const now = new Date();
        const isDiscountActive = (!discountStartDate || new Date(discountStartDate) <= now) &&
            (!discountEndDate || new Date(discountEndDate) >= now);

        productData.price = isDiscountActive ?
            originalPrice - (originalPrice * parseFloat(discountPercentage)) / 100 :
            originalPrice;
    }

    return productData;
};

/**
 * @route   POST /api/products/new
 * @desc    Create a new product
 * @access  Private (Sellers only)
 */
router.post('/new', protect, sellerOnly, upload.array('images', 5), async (req, res) => {
    try {
        const productData = processProductData(req);
        productData.seller = req.user.id;
        const product = await Product.create(productData);
        res.status(201).json({ success: true, product });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(error.status || 500).json({ success: false, message: error.message || 'Server error while creating product.' });
    }
});

/**
 * @route   GET /api/products/myproducts
 * @desc    Get products created by the logged-in seller
 * @access  Private (Sellers only)
 */
router.get('/myproducts', protect, sellerOnly, async (req, res) => {
    try {
        const products = await Product.find({ seller: req.user.id });
        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Error fetching seller products:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching your products.' });
    }
});

/**
 * @route   GET /api/products/seller/:sellerId
 * @desc    Get all products by a specific seller
 * @access  Public
 */
router.get('/seller/:sellerId', async (req, res) => {
    try {
        const products = await Product.find({ seller: req.params.sellerId }).populate('seller', 'name email businessName businessCategory bio');
        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Error fetching seller products:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching seller products.' });
    }
});

/**
 * @route   GET /api/products/recommendations
 * @desc    Get recommended products based on user's viewed and purchased categories
 * @access  Private
 */
router.get('/recommendations', protect, async (req, res) => {
    try {
        console.log('Recommendations endpoint called for user:', req.user.id);
        const limit = parseInt(req.query.limit) || 10;
        console.log('Limit:', limit);
        const { User } = require('../models/userModel');
        const user = await User.findById(req.user.id);
        console.log('User found:', !!user);

        if (!user) {
            console.log('User not found');
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Ensure arrays exist (for backward compatibility)
        if (!user.viewedCategories) user.viewedCategories = [];
        if (!user.purchasedCategories) user.purchasedCategories = [];
        console.log('Viewed categories:', user.viewedCategories.length);
        console.log('Purchased categories:', user.purchasedCategories.length);

        // Combine viewed and purchased categories, prioritizing purchased (weight 2x)
        const categoryScores = {};

        // Add viewed categories with weight 1
        user.viewedCategories.forEach(cat => {
            categoryScores[cat.category] = (categoryScores[cat.category] || 0) + cat.count;
        });

        // Add purchased categories with weight 2
        user.purchasedCategories.forEach(cat => {
            categoryScores[cat.category] = (categoryScores[cat.category] || 0) + (cat.count * 2);
        });

        console.log('Category scores:', categoryScores);

        // Sort categories by score descending
        const sortedCategories = Object.entries(categoryScores)
            .sort(([,a], [,b]) => b - a)
            .map(([category]) => category);

        console.log('Sorted categories:', sortedCategories);

        if (sortedCategories.length === 0) {
            console.log('No categories, fetching random products');
            // If no categories, return random products
            const products = await Product.find({ seller: { $ne: req.user.id } })
                .populate('seller', 'name email')
                .limit(limit)
                .sort({ createdAt: -1 });
            console.log('Random products found:', products.length);
            return res.status(200).json({ success: true, products });
        }

        console.log('Fetching products for categories:', sortedCategories);
        // Find products in top categories, excluding user's own products
        const products = await Product.find({
            category: { $in: sortedCategories },
            seller: { $ne: req.user.id }
        })
            .populate('seller', 'name email')
            .limit(limit)
            .sort({ createdAt: -1 });

        console.log('Recommended products found:', products.length);
        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ success: false, message: 'Server error while fetching recommendations.' });
    }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get a single product by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('seller', 'name email');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Increment view count
        await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

        // Track viewed category for logged-in users
        if (req.user) {
            const { User } = require('../models/userModel');
            const user = await User.findById(req.user.id);
            if (user) {
                // Ensure viewedCategories array exists
                if (!user.viewedCategories) user.viewedCategories = [];
                const categoryIndex = user.viewedCategories.findIndex(cat => cat.category === product.category);
                if (categoryIndex > -1) {
                    user.viewedCategories[categoryIndex].count += 1;
                } else {
                    user.viewedCategories.push({ category: product.category, count: 1 });
                }
                await user.save();
            }
        }

        res.status(200).json({ success: true, product });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching product.' });
    }
});

/**
 * @route   GET /api/products
 * @desc    Get all products with optional filtering and pagination
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const { category, limit, page } = req.query;
        let query = {};

        if (category) {
            query.category = category;
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20; // Default limit to 20
        const skip = (pageNum - 1) * limitNum;

        let productsQuery = Product.find(query).populate('seller', 'name email');

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(query);

        const products = await productsQuery.skip(skip).limit(limitNum);

        const totalPages = Math.ceil(totalProducts / limitNum);

        res.status(200).json({
            success: true,
            products,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalProducts,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching products.' });
    }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Private (Owner only)
 */

// Middleware to check product ownership
const checkProductOwner = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.seller.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'User not authorized' });
        }
        req.product = product; // Pass product to the next handler
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error while verifying product ownership.' });
    }
};
router.put('/:id', protect, sellerOnly, upload.array('images', 5), checkProductOwner, async (req, res) => {
    try {
        const updateData = processProductData(req);
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        });

        res.status(200).json({ success: true, product: updatedProduct });

    } catch (error) {
        console.error('Error updating product:', error);
        res.status(error.status || 500).json({ success: false, message: error.message || 'Server error while updating product.' });
    }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Private (Owner only)
 */
router.delete('/:id', protect, sellerOnly, checkProductOwner, async (req, res) => {
    try {
        // Delete images from Cloudinary before deleting the product from the DB
        if (req.product.images && req.product.images.length > 0) {
            const publicIdsToDelete = req.product.images.map(image => image.public_id);
            // Asynchronously delete from Cloudinary.
            cloudinary.api.delete_resources(publicIdsToDelete, (error, result) => {
                if (error) console.error("Error deleting product images from Cloudinary:", error);
                // Optional: log result for debugging
            });
        }

        await req.product.deleteOne();

        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'Server error while deleting product.' });
    }
});

/**
 * @route   GET /api/products/recommendations
 * @desc    Get recommended products based on user's viewed and purchased categories
 * @access  Private
 */
router.get('/recommendations', protect, async (req, res) => {
    try {
        console.log('Recommendations endpoint called for user:', req.user.id);
        const limit = parseInt(req.query.limit) || 10;
        console.log('Limit:', limit);
        const { User } = require('../models/userModel');
        const user = await User.findById(req.user.id);
        console.log('User found:', !!user);

        if (!user) {
            console.log('User not found');
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Ensure arrays exist (for backward compatibility)
        if (!user.viewedCategories) user.viewedCategories = [];
        if (!user.purchasedCategories) user.purchasedCategories = [];
        console.log('Viewed categories:', user.viewedCategories.length);
        console.log('Purchased categories:', user.purchasedCategories.length);

        // Combine viewed and purchased categories, prioritizing purchased (weight 2x)
        const categoryScores = {};

        // Add viewed categories with weight 1
        user.viewedCategories.forEach(cat => {
            categoryScores[cat.category] = (categoryScores[cat.category] || 0) + cat.count;
        });

        // Add purchased categories with weight 2
        user.purchasedCategories.forEach(cat => {
            categoryScores[cat.category] = (categoryScores[cat.category] || 0) + (cat.count * 2);
        });

        console.log('Category scores:', categoryScores);

        // Sort categories by score descending
        const sortedCategories = Object.entries(categoryScores)
            .sort(([,a], [,b]) => b - a)
            .map(([category]) => category);

        console.log('Sorted categories:', sortedCategories);

        if (sortedCategories.length === 0) {
            console.log('No categories, fetching random products');
            // If no categories, return random products
            const products = await Product.find({ seller: { $ne: req.user.id } })
                .populate('seller', 'name email')
                .limit(limit)
                .sort({ createdAt: -1 });
            console.log('Random products found:', products.length);
            return res.status(200).json({ success: true, products });
        }

        console.log('Fetching products for categories:', sortedCategories);
        // Find products in top categories, excluding user's own products
        const products = await Product.find({
            category: { $in: sortedCategories },
            seller: { $ne: req.user.id }
        })
            .populate('seller', 'name email')
            .limit(limit)
            .sort({ createdAt: -1 });

        console.log('Recommended products found:', products.length);
        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ success: false, message: 'Server error while fetching recommendations.' });
    }
});

module.exports = router;
