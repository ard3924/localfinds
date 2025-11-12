const express = require('express');
const router = express.Router();
const Review = require('../models/reviewModel');
const Product = require('../models/productModel');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/reviews/:productId
 * @desc    Get all reviews for a specific product
 * @access  Public
 */
router.get('/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        // Calculate rating distribution
        const ratingDistribution = [0, 0, 0, 0, 0]; // Index 0 = 1 star, index 4 = 5 stars
        reviews.forEach(review => {
            ratingDistribution[review.rating - 1]++;
        });

        // Calculate average rating
        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;

        res.status(200).json({
            success: true,
            reviews,
            ratingDistribution,
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: reviews.length
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching reviews.' });
    }
});

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;

        // Validate required fields
        if (!productId || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Product ID, rating, and comment are required.'
            });
        }

        // Validate rating range
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5.'
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.'
            });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            product: productId,
            user: req.user.id
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product.'
            });
        }

        // Create the review
        const review = await Review.create({
            product: productId,
            user: req.user.id,
            rating: parseInt(rating),
            comment: comment.trim()
        });

        // Populate user data for response
        await review.populate('user', 'name');

        res.status(201).json({
            success: true,
            review,
            message: 'Review submitted successfully.'
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while creating review.'
        });
    }
});

/**
 * @route   PUT /api/reviews/:reviewId/like
 * @desc    Like or unlike a review
 * @access  Private
 */
router.put('/:reviewId/like', protect, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found.'
            });
        }

        const userId = req.user.id;
        const hasLiked = review.likes.includes(userId);
        const hasDisliked = review.dislikes.includes(userId);

        if (hasLiked) {
            // Remove like
            review.likes = review.likes.filter(id => id.toString() !== userId);
        } else {
            // Add like and remove dislike if exists
            review.likes.push(userId);
            if (hasDisliked) {
                review.dislikes = review.dislikes.filter(id => id.toString() !== userId);
            }
        }

        await review.save();

        res.status(200).json({
            success: true,
            likes: review.likes.length,
            dislikes: review.dislikes.length,
            userLiked: !hasLiked,
            userDisliked: false
        });
    } catch (error) {
        console.error('Error liking review:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while processing like.'
        });
    }
});

/**
 * @route   PUT /api/reviews/:reviewId/dislike
 * @desc    Dislike or undislike a review
 * @access  Private
 */
router.put('/:reviewId/dislike', protect, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found.'
            });
        }

        const userId = req.user.id;
        const hasLiked = review.likes.includes(userId);
        const hasDisliked = review.dislikes.includes(userId);

        if (hasDisliked) {
            // Remove dislike
            review.dislikes = review.dislikes.filter(id => id.toString() !== userId);
        } else {
            // Add dislike and remove like if exists
            review.dislikes.push(userId);
            if (hasLiked) {
                review.likes = review.likes.filter(id => id.toString() !== userId);
            }
        }

        await review.save();

        res.status(200).json({
            success: true,
            likes: review.likes.length,
            dislikes: review.dislikes.length,
            userLiked: false,
            userDisliked: !hasDisliked
        });
    } catch (error) {
        console.error('Error disliking review:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while processing dislike.'
        });
    }
});

/**
 * @route   DELETE /api/reviews/:reviewId
 * @desc    Delete a review
 * @access  Private (Review owner only)
 */
router.delete('/:reviewId', protect, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found.'
            });
        }

        // Check if user owns the review
        if (review.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this review.'
            });
        }

        await review.remove();

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully.'
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting review.'
        });
    }
});

module.exports = router;
