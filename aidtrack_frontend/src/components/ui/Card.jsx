import React from 'react';

const Card = ({ children, className = '', hover = false }) => {
    return (
        <div
            className={`
        glass-panel rounded-2xl p-6 
        ${hover ? 'transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
};

export default Card;
