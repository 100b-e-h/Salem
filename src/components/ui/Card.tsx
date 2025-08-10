// Componente de Card reutilizável

import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    shadow?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

export function Card({
    children,
    className = '',
    padding = 'md',
    shadow = 'md',
    hover = false
}: CardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };

    const shadowClasses = {
        none: '',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg'
    };

    const baseClasses = 'bg-white rounded-lg border border-gray-200';
    const hoverClasses = hover ? 'hover:shadow-lg transition-shadow duration-200 cursor-pointer' : '';

    return (
        <div
            className={`
        ${baseClasses} 
        ${paddingClasses[padding]} 
        ${shadowClasses[shadow]} 
        ${hoverClasses} 
        ${className}
      `.trim()}
        >
            {children}
        </div>
    );
}
