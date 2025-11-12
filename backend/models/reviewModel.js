const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true,
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Review comment cannot exceed 500 characters'],
    },
    likes: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    }],
    dislikes: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    }],
}, { timestamps: true });

// Prevent duplicate reviews from same user for same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Update product's average rating and review count when review is saved
reviewSchema.post('save', async function() {
    const Product = mongoose.model('Product');
    const reviews = await mongoose.model('Review').find({ product: this.product });

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    const reviewCount = reviews.length;

    await Product.findByIdAndUpdate(this.product, {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        reviewCount
    });
});

// Update product's average rating and review count when review is removed
reviewSchema.post('remove', async function() {
    const Product = mongoose.model('Product');
    const reviews = await mongoose.model('Review').find({ product: this.product });

    if (reviews.length === 0) {
        await Product.findByIdAndUpdate(this.product, {
            averageRating: 0,
            reviewCount: 0
        });
    } else {
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        const reviewCount = reviews.length;

        await Product.findByIdAndUpdate(this.product, {
            averageRating: Math.round(averageRating * 10) / 10,
            reviewCount
        });
    }
});

module.exports = mongoose.model('Review', reviewSchema);
