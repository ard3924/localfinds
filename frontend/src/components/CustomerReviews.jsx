import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Star, Loader2, Send, User } from 'lucide-react';
import axiosInstance from '../axiosintreceptor.js';
import toast from 'react-hot-toast';

const CustomerReviews = ({ productId }) => {
    const [reviews, setReviews] = useState([]);
    const [ratingDistribution, setRatingDistribution] = useState([0, 0, 0, 0, 0]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [likingReview, setLikingReview] = useState(null);

    const generateAvatarColor = (name) => {
        if (!name) return 'bg-gray-300';
        const colors = [
            'bg-red-200 text-red-800', 'bg-green-200 text-green-800', 'bg-blue-200 text-blue-800',
            'bg-yellow-200 text-yellow-800', 'bg-indigo-200 text-indigo-800', 'bg-purple-200 text-purple-800',
            'bg-pink-200 text-pink-800', 'bg-teal-200 text-teal-800'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash % colors.length);
        return colors[index];
    };

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/reviews/${productId}`);
            if (response.data.success) {
                setReviews(response.data.reviews);
                setRatingDistribution(response.data.ratingDistribution);
                setAverageRating(response.data.averageRating);
                setTotalReviews(response.data.totalReviews);
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setError('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await axiosInstance.get('/user/account');
            if (response.data) {
                setCurrentUser(response.data);
            }
        } catch (err) {
            // User not logged in, that's okay
        }
    };

    useEffect(() => {
        if (productId) {
            fetchReviews();
            fetchCurrentUser();
        }
    }, [productId]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            toast.error('Please sign in to submit a review');
            return;
        }

        if (!newReview.comment.trim()) {
            toast.error('Please enter a comment');
            return;
        }

        setSubmittingReview(true);
        try {
            const response = await axiosInstance.post('/reviews', {
                productId,
                rating: newReview.rating,
                comment: newReview.comment.trim()
            });

            if (response.data.success) {
                toast.success('Review submitted successfully!');
                setNewReview({ rating: 5, comment: '' });
                setShowReviewForm(false);
                fetchReviews(); // Refresh reviews
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            if (err.response?.status === 400 && err.response.data.message === 'You have already reviewed this product.') {
                toast.error('You have already reviewed this product');
            } else {
                toast.error('Failed to submit review');
            }
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleLikeReview = async (reviewId) => {
        if (!currentUser) {
            toast.error('Please sign in to like reviews');
            return;
        }

        setLikingReview(reviewId);
        try {
            const response = await axiosInstance.put(`/reviews/${reviewId}/like`);
            if (response.data.success) {
                // Update the review in the local state
                setReviews(reviews.map(review =>
                    review._id === reviewId
                        ? {
                            ...review,
                            likes: response.data.likes,
                            dislikes: response.data.dislikes
                        }
                        : review
                ));
            }
        } catch (err) {
            console.error('Error liking review:', err);
            toast.error('Failed to like review');
        } finally {
            setLikingReview(null);
        }
    };

    const handleDislikeReview = async (reviewId) => {
        if (!currentUser) {
            toast.error('Please sign in to dislike reviews');
            return;
        }

        setLikingReview(reviewId);
        try {
            const response = await axiosInstance.put(`/reviews/${reviewId}/dislike`);
            if (response.data.success) {
                // Update the review in the local state
                setReviews(reviews.map(review =>
                    review._id === reviewId
                        ? {
                            ...review,
                            likes: response.data.likes,
                            dislikes: response.data.dislikes
                        }
                        : review
                ));
            }
        } catch (err) {
            console.error('Error disliking review:', err);
            toast.error('Failed to dislike review');
        } finally {
            setLikingReview(null);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
        return `${Math.ceil(diffDays / 365)} years ago`;
    };

    if (loading) {
        return (
            <div className="bg-white py-20 sm:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading reviews...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white py-20 sm:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={fetchReviews}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div id="reviews" className="bg-white py-20 sm:py-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800">Customer Reviews</h2>
                    <p className="mt-4 text-lg text-gray-600">Real reviews from real customers.</p>
                </div>

                {/* Write Review Button */}
                {currentUser && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setShowReviewForm(!showReviewForm)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            {showReviewForm ? 'Cancel Review' : 'Write a Review'}
                        </button>
                    </div>
                )}

                {/* Review Form */}
                {showReviewForm && currentUser && (
                    <div className="mt-8 bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold mb-4">Write Your Review</h3>
                        <form onSubmit={handleSubmitReview}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setNewReview({ ...newReview, rating: star })}
                                            className="mr-1"
                                        >
                                            <Star
                                                className={`w-6 h-6 ${star <= newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                                <textarea
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    rows={4}
                                    placeholder="Share your experience with this product..."
                                    maxLength={500}
                                />
                                <p className="text-sm text-gray-500 mt-1">{newReview.comment.length}/500 characters</p>
                            </div>
                            <button
                                type="submit"
                                disabled={submittingReview}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center"
                            >
                                {submittingReview ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Submit Review
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Overall Rating and Breakdown */}
                {totalReviews > 0 && (
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        {/* Overall Rating */}
                        <div className="flex flex-col items-center md:items-start">
                            <div className="flex items-baseline">
                                <p className="text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
                                <p className="text-gray-600 ml-2">out of 5</p>
                            </div>
                            <div className="flex text-yellow-400 my-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-5 h-5 ${i < Math.floor(averageRating) ? 'fill-current' : 'text-gray-300'}`} />
                                ))}
                            </div>
                            <p className="text-sm text-gray-600">Based on {totalReviews} reviews</p>
                        </div>

                        {/* Rating Breakdown */}
                        <div className="col-span-2">
                            {[5, 4, 3, 2, 1].map((stars) => {
                                const count = ratingDistribution[stars - 1];
                                const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                                return (
                                    <div key={stars} className="flex items-center space-x-2 text-sm mb-1">
                                        <span className="text-gray-600">{stars}</span>
                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                                        </div>
                                        <span className="text-gray-500 w-10 text-right">{percent}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Individual Reviews */}
                {reviews.length > 0 ? (
                    <div className="mt-8 border-t border-gray-200 pt-8 space-y-8">
                        {reviews.map(review => (
                            <div key={review._id} className="border-b border-gray-100 pb-6 last:border-b-0">
                                <div className="flex items-start">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${generateAvatarColor(review.user?.name || 'Anonymous')}`}>
                                        {(review.user?.name || 'A')[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-800">{review.user?.name || 'Anonymous'}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-gray-700">{review.comment}</p>
                                        <div className="flex items-center text-gray-500 text-sm mt-3 space-x-4">
                                            <button
                                                onClick={() => handleLikeReview(review._id)}
                                                disabled={likingReview === review._id}
                                                className={`flex items-center hover:text-green-600 transition-colors ${likingReview === review._id ? 'opacity-50' : ''}`}
                                            >
                                                <ThumbsUp className="h-4 w-4 mr-1" /> {review.likes?.length || 0}
                                            </button>
                                            <button
                                                onClick={() => handleDislikeReview(review._id)}
                                                disabled={likingReview === review._id}
                                                className={`flex items-center hover:text-red-600 transition-colors ${likingReview === review._id ? 'opacity-50' : ''}`}
                                            >
                                                <ThumbsDown className="h-4 w-4 mr-1" /> {review.dislikes?.length || 0}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-16 text-center">
                        <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerReviews;
