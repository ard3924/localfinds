import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axiosInstance from '../axiosintreceptor.js';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

const wishlistReducer = (state, action) => {
    switch (action.type) {
        case 'SET_WISHLIST': {
            return action.payload;
        }
        case 'ADD_ITEM': {
            const newItem = action.payload;
            const existingItem = state.find(item => item.product._id === newItem.product._id);
            if (existingItem) {
                // Item already in wishlist, do nothing
                return state;
            }
            return [...state, newItem];
        }
        case 'REMOVE_ITEM': {
            return state.filter(item => item.product._id !== action.payload.id);
        }
        case 'CLEAR_WISHLIST': {
            return [];
        }
        default:
            return state;
    }
};

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, dispatch] = useReducer(wishlistReducer, []);

    // Fetch wishlist on mount
    useEffect(() => {
        const fetchWishlist = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const response = await axiosInstance.get('/user/wishlist');
                if (response.data) {
                    dispatch({ type: 'SET_WISHLIST', payload: response.data.wishlist });
                }
            } catch (error) {
                console.error('Failed to fetch wishlist:', error);
            }
        };

        fetchWishlist();
    }, []);

    const addToWishlist = async (item) => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Please sign in to add items to your wishlist');
            throw new Error('Authentication required');
        }

        try {
            const response = await axiosInstance.post('/user/wishlist', { productId: item._id });
            if (response.data) {
                dispatch({ type: 'ADD_ITEM', payload: { product: item, addedAt: new Date() } });
                toast.success(`${item.name} added to wishlist!`);
            }
        } catch (error) {
            if (error.response?.status === 400 && error.response.data.message === 'Product already in wishlist') {
                toast.error('Product already in wishlist');
            } else {
                throw error;
            }
        }
    };

    const removeFromWishlist = async (id) => {
        try {
            await axiosInstance.delete(`/user/wishlist/${id}`);
            dispatch({ type: 'REMOVE_ITEM', payload: { id } });
            toast.success('Product removed from wishlist');
        } catch (error) {
            console.error('Failed to remove from wishlist:', error);
            toast.error('Failed to remove from wishlist');
        }
    };

    const clearWishlist = () => {
        dispatch({ type: 'CLEAR_WISHLIST' });
    };

    const isInWishlist = (id) => {
        return wishlistItems.some(item => item.product._id === id);
    };

    return (
        <WishlistContext.Provider value={{
            wishlistItems,
            addToWishlist,
            removeFromWishlist,
            clearWishlist,
            isInWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
