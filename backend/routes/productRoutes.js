const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const { protect, sellerOnly } = require('../middleware/authMiddleware');
const { upload, cloudinary } = require('../middleware/uploadMiddleware');

// --- Helper Function ---
const processProductData = (req) => {
    const { name, description, price, category, discountPercentage, discountStartDate, discountEndDate, existingImages } = req.body;
    const newImages = req.files ? req.files.map(file => ({ url: file.path, public_id: file.filename })) : [];
    let allImages = [];

    if (req.product) { 
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
    } else {
        allImages = newImages;
    }

    if (allImages.length === 0) {
        const err = new Error('A product must have at least one image.');
        err.status = 400;
        throw err;
    }

    const productData = { ...req.body, images: allImages };
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

// ==========================================
// STATIC ROUTES (MUST BE ABOVE /:id)
// ==========================================

router.post('/new', protect, sellerOnly, upload.array('images', 5), async (req, res) => {
    try {
        const productData = processProductData(req);
        productData.seller = req.user.id;
        const product = await Product.create(productData);
        res.status(201).json({ success: true, product });
    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
});

router.get('/myproducts', protect, sellerOnly, async (req, res) => {
    try {
        const products = await Product.find({ seller: req.user.id });
        res.status(200).json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/recommendations', protect, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const { User } = require('../models/userModel');
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const categoryScores = {};
        (user.viewedCategories || []).forEach(cat => categoryScores[cat.category] = (categoryScores[cat.category] || 0) + cat.count);
        (user.purchasedCategories || []).forEach(cat => categoryScores[cat.category] = (categoryScores[cat.category] || 0) + (cat.count * 2));

        const sortedCategories = Object.entries(categoryScores).sort(([,a], [,b]) => b - a).map(([category]) => category);

        const query = sortedCategories.length > 0 
            ? { category: { $in: sortedCategories }, seller: { $ne: req.user.id } }
            : { seller: { $ne: req.user.id } };

        const products = await Product.find(query).populate('seller', 'name email').limit(limit).sort({ createdAt: -1 });
        res.status(200).json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/seller/:sellerId', async (req, res) => {
    try {
        const products = await Product.find({ seller: req.params.sellerId }).populate('seller', 'name email businessName businessCategory bio');
        res.status(200).json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/', async (req, res) => {
    try {
        const { category, limit, page } = req.query;
        let query = category ? { category } : {};
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const totalProducts = await Product.countDocuments(query);
        const products = await Product.find(query).populate('seller', 'name email').skip((pageNum - 1) * limitNum).limit(limitNum);
        res.status(200).json({ success: true, products, pagination: { currentPage: pageNum, totalPages: Math.ceil(totalProducts / limitNum) } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// DYNAMIC ROUTES (MUST BE AT THE BOTTOM)
// ==========================================

router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('seller', 'name email');
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.status(200).json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

const checkProductOwner = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product || product.seller.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        req.product = product;
        next();
    } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
};

router.put('/:id', protect, sellerOnly, upload.array('images', 5), checkProductOwner, async (req, res) => {
    try {
        const updateData = processProductData(req);
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.status(200).json({ success: true, product: updatedProduct });
    } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.delete('/:id', protect, sellerOnly, checkProductOwner, async (req, res) => {
    try {
        if (req.product.images?.length > 0) {
            const ids = req.product.images.map(img => img.public_id);
            cloudinary.api.delete_resources(ids);
        }
        await req.product.deleteOne();
        res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;