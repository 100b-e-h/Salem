// Componente de Header/Navegação principal

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
    name: string;
    href: string;
    icon: string;
}

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Contas', href: '/accounts', icon: '🏦' },
    { name: 'Cartões', href: '/cards', icon: '💳' },
    { name: 'Faturas', href: '/invoices', icon: '📄' },
    { name: 'Parceladas', href: '/installments', icon: '#️⃣' },
    { name: 'Assinaturas', href: '/subscriptions', icon: '♻️' },
    { name: 'Recorrentes', href: '/recurrences', icon: '⚙️' },
    { name: 'Rendimentos', href: '/assets', icon: '📈' },
    { name: 'Calendário', href: '/calendar', icon: '📅' },
    { name: 'Relatórios', href: '/reports', icon: '📋' },
];

export function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(href);
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="text-2xl">🔮</div>
                            <h1 className="text-xl font-bold text-gray-900">Salem</h1>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive(item.href)
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                                    }
                `}
                            >
                                <span className="mr-1">{item.icon}</span>
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                {isMobileMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`
                    block px-3 py-2 rounded-md text-base font-medium transition-colors
                    ${isActive(item.href)
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                                        }
                  `}
                                >
                                    <span className="mr-2">{item.icon}</span>
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
