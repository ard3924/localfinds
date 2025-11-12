import React from 'react';

const ProductCardSkeleton = () => {
    return (
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200 p-3">
            <div className="aspect-[4/3] w-full bg-gray-200 rounded-md animate-pulse"></div>
            <div className="mt-3 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                <div className="h-9 bg-gray-200 rounded w-full animate-pulse"></div>
            </div>
        </div>
    );
};

export default ProductCardSkeleton;