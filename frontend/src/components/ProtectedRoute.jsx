import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        toast.error('Please sign in to access this page');
    }

    // If authorized, return an outlet that will render child elements
    // If not, return element that will navigate to login page
    return token ? <Outlet /> : <Navigate to="/signin" />;
};

export default ProtectedRoute;
