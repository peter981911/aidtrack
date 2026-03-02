import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    type = 'button',
    className = '',
    to,
    disabled = false,
    isLoading = false
}) => {
    const baseClasses = "inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 rounded-lg transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

    const variants = {
        primary: "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5",
        secondary: "bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-primary hover:border-primary/30",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200",
        danger: "bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600",
    };

    const classes = `${baseClasses} ${variants[variant] || variants.primary} ${className}`;

    const content = (
        <>
            {isLoading && (
                <svg className="w-4 h-4 mr-2 -ml-1 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </>
    );

    if (to) {
        return (
            <Link to={to} className={classes}>
                {content}
            </Link>
        );
    }

    return (
        <button type={type} onClick={onClick} className={classes} disabled={disabled || isLoading}>
            {content}
        </button>
    );
};

export default Button;
