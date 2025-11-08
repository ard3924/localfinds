import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_ITEM': {
            const { item: newItem, quantity } = action.payload;
            const existingItem = state.find(item => item._id === newItem._id);
            if (existingItem) {
                // If item exists, increase quantity
                return state.map(item =>
                    item._id === newItem._id ? { ...item, quantity: item.quantity + quantity } : item
                );
            }
            return [...state, { ...newItem, quantity: quantity }];
        }
        case 'REMOVE_ITEM': {
            return state.filter(item => item._id !== action.payload.id);
        }
        case 'CLEAR_CART': {
            return [];
        }
        case 'LOAD_CART': {
            return action.payload;
        }
        default:
            return state;
    }
};

export const CartProvider = ({ children }) => {
    const [cartItems, dispatch] = useReducer(cartReducer, []);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                dispatch({ type: 'LOAD_CART', payload: parsedCart });
            } catch (error) {
                console.error('Error loading cart from localStorage:', error);
            }
        }
    }, []);

    // Save cart to localStorage whenever cartItems change
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (item, quantity = 1) => {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required');
        }
        dispatch({ type: 'ADD_ITEM', payload: { item, quantity } });
    };

    const removeFromCart = (id) => {
        dispatch({ type: 'REMOVE_ITEM', payload: { id } });
    };

    const clearCart = () => {
        dispatch({ type: 'CLEAR_CART' });
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, getCartTotal }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};