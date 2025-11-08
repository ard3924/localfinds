import React from 'react';

const FeatureCard = ({ icon, title, children }) => {
    return (
        <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mx-auto mb-6">
                {React.cloneElement(icon, { size: 32 })}
            </div>
            <h3 className="text-xl font-bold text-center mb-4">{title}</h3>
            <p className="text-gray-600 text-center">{children}</p>
        </div>
    );
};

export default FeatureCard;