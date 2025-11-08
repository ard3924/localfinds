import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Package, Heart, Store } from 'lucide-react';

const SidebarLink = ({ to, icon, children }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    const activeClass = "bg-green-100 text-green-700";
    const inactiveClass = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";

    return (
        <Link
            to={to}
            className={`flex items-center justify-center lg:justify-start flex-1 lg:flex-none px-3 py-2 text-sm lg:text-lg font-medium rounded-lg transition-colors duration-200 ${isActive ? activeClass : inactiveClass}`}
            aria-current={isActive ? "page" : undefined}
        >
            {icon}
            {children}
        </Link>
    );
};

const AccountSidebar = () => {
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        // Get user role from localStorage or API
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role);
            } catch (error) {
                console.error('Error parsing token:', error);
            }
        }
    }, []);

    return (
        <aside className="lg:col-span-1 lg:self-start lg:sticky lg:top-24">
            <div className="bg-white p-4 lg:p-6 rounded-xl shadow-lg">
                <h3 className="hidden lg:block text-2xl font-bold text-gray-900 mb-6">My Dashboard</h3>
                <nav className="flex justify-around lg:flex-col lg:space-y-3">
                    <SidebarLink
                        to="/account"
                        icon={<User className="h-5 w-5 mr-3" />}
                    >
                        My Profile
                    </SidebarLink>
                    {userRole === 'seller' && (
                        <SidebarLink
                            to="/seller-dashboard"
                            icon={<Store className="h-5 w-5 mr-3" />}
                        >
                            Seller Dashboard
                        </SidebarLink>
                    )}
                    {userRole !== 'seller' && (
                        <>
                            <SidebarLink
                                to="/orders"
                                icon={<Package className="h-5 w-5 mr-3" />}
                            >
                                My Orders
                            </SidebarLink>
                            <SidebarLink
                                to="/wishlist"
                                icon={<Heart className="h-5 w-5 mr-3" />}
                            >
                                My Wishlist
                            </SidebarLink>
                        </>
                    )}
                </nav>
            </div>
        </aside>
    );
};

export default AccountSidebar;
