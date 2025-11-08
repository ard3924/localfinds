import React from 'react';
import { ThumbsUp, ThumbsDown, Star } from 'lucide-react';

const CustomerReviews = () => {
    const reviews = [
        { img: 3, name: "Sophia Carter", time: "2 weeks ago", rating: 5, comment: "This smartphone exceeded my expectations! The camera quality is superb, and the battery life lasts all day. Highly recommend!", likes: 35, dislikes: 6 },
        { img: 4, name: "Ethan Bennett", time: "1 month ago", rating: 4, comment: "Great phone overall, but the user interface could be more intuitive. The performance is top-notch, and the display is vibrant.", likes: 18, dislikes: 3 }
    ];

    return (
        <div className="bg-white py-20 sm:py-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800">What Our Customers Say</h2>
                    <p className="mt-4 text-lg text-gray-600">Real reviews from real customers.</p>
                </div>
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    {/* Overall Rating */}
                    <div className="flex flex-col items-center md:items-start">
                        <div className="flex items-baseline">
                            <p className="text-5xl font-bold text-gray-900">4.5</p>
                            <p className="text-gray-600 ml-2">out of 5</p>
                        </div>
                        <div className="flex text-yellow-400 my-2">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-5 h-5 ${i < 4 ? 'fill-current' : 'text-gray-300'}`} />
                            ))}
                        </div>
                        <p className="text-sm text-gray-600">Based on 125 reviews</p>
                    </div>

                    {/* Rating Breakdown */}
                    <div className="col-span-2">
                        {[{ stars: 5, percent: "40%" }, { stars: 4, percent: "30%" }, { stars: 3, percent: "15%" }, { stars: 2, percent: "10%" }, { stars: 1, percent: "5%" }].map(rating => (
                            <div key={rating.stars} className="flex items-center space-x-2 text-sm mb-1">
                                <span className="text-gray-600">{rating.stars}</span>
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: rating.percent }}></div>
                                </div>
                                <span className="text-gray-500 w-10 text-right">{rating.percent}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Individual Reviews */}
                <div className="mt-8 border-t border-gray-200 pt-8 space-y-8">
                    {reviews.map(review => (
                        <div key={review.name}>
                            <div className="flex items-start">
                                <img src={`https://i.pravatar.cc/40?img=${review.img}`} alt="Reviewer" className="w-10 h-10 rounded-full mr-4" />
                                <div>
                                    <p className="font-semibold text-gray-800">{review.name}</p>
                                    <p className="text-xs text-gray-500">{review.time}</p>
                                </div>
                            </div>
                            <p className="mt-2 text-gray-700 pl-14">{review.comment}</p>
                            <div className="flex items-center text-gray-500 text-sm mt-3 pl-14 space-x-4">
                                <div className="flex items-center cursor-pointer hover:text-green-600"><ThumbsUp className="h-4 w-4 mr-1" /> {review.likes}</div>
                                <div className="flex items-center cursor-pointer hover:text-red-600"><ThumbsDown className="h-4 w-4 mr-1" /> {review.dislikes}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CustomerReviews;