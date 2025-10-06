'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from './AuthProvider';
import { AuthDialog } from './AuthDialog';
import { Button } from './ui/Button';

interface NavItem {
    name: string;
    href: string;
    icon?: string;
}

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/' },
    { name: 'Contas', href: '/accounts' },
    { name: 'Cartões', href: '/cards' },
    { name: 'Faturas', href: '/invoices' },
    { name: 'Parceladas', href: '/installments' },
    { name: 'Assinaturas', href: '/subscriptions' },
    { name: 'Recorrentes', href: '/recurrences' },
];

export function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const pathname = usePathname();
    const { user, signOut, loading } = useAuth();

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(href);
    };

    return (
        <header className="bg-background shadow-sm border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-3 items-center h-16">
                    {/* Logo à esquerda */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="text-2xl">🔮</div>
                            <h1 className="text-xl font-bold text-foreground">Salem</h1>
                        </Link>
                    </div>

                    {/* Menu centralizado */}
                    <div className="hidden md:flex justify-center">
                        {user && (
                            <nav className="flex space-x-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={` px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(item.href)
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                                            }`}
                                    >
                                        <span className="mr-1">{item.icon}</span>
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                        )}
                    </div>

                    {/* Ações à direita */}
                    <div className="hidden md:flex justify-end items-center space-x-2">
                        <ThemeToggle />
                        {user ? (
                            <Button variant="outline" onClick={signOut} disabled={loading}>
                                Sair
                            </Button>
                        ) : (
                            <Button onClick={() => setAuthDialogOpen(true)} disabled={loading}>
                                Entrar
                            </Button>
                        )}
                    </div>

                    {/* Mobile menu button e theme toggle */}
                    <div className="md:hidden flex items-center space-x-2 col-span-3 justify-between w-full">
                        <div className="flex items-center">
                            <ThemeToggle />
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
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
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-border">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={` block px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive(item.href)
                                        ? 'bg-accent text-accent-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                                        }`}
                                >
                                    <span className="mr-2">{item.icon}</span>
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <AuthDialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
        </header>
    );
}
