import React from 'react';
import { Toaster } from 'react-hot-toast';

const Toast = () => {
    return (
        <Toaster
            position="bottom-center"
            reverseOrder={false}
            gutter={12}
            toastOptions={{
                // Default options
                style: {
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    color: '#374151',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px',
                    fontSize: '15px',
                },
                duration: 4000,
                // Success
                success: {
                    iconTheme: { primary: '#10B981', secondary: 'white' },
                },
                // Error
                error: {
                    iconTheme: { primary: '#EF4444', secondary: 'white' },
                },
            }}
        />
    );
};

export default Toast;