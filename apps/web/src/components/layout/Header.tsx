'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { 
    Search, 
    ShoppingCart, 
    User, 
    Menu, 
    X, 
    Zap, 
    Shield, 
    Gamepad2,
    ChevronRight,
    LayoutDashboard,
    LogOut,
    Monitor,
    Gift,
    Repeat,
    Star,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/design-system/primitives/sheet';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/CartContext';

export function Header(): React.ReactElement {
    const pathname = usePathname();
    const { isAuthenticated, user, logout } = useAuth();
    const { itemCount } = useCart();
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Keyboard shortcut: ⌘K or Ctrl+K to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
                // Focus the search input after opening
                setTimeout(() => {
                    const searchInput = document.querySelector('input[type="search"]');
                    if (searchInput instanceof HTMLInputElement) {
                        searchInput.focus();
                    }
                }, 100);
            }
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const isActiveLink = (href: string): boolean => pathname === href;

    const navLinks = [
        { href: '/catalog', label: 'Gaming', icon: Gamepad2 },
        { href: '/catalog', label: 'Software', icon: Monitor },
        { href: '/catalog', label: 'Gift Cards', icon: Gift },
        { href: '/catalog', label: 'Subscriptions', icon: Repeat },
        { href: '/reviews', label: 'Reviews', icon: Star },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border-subtle/50 bg-bg-primary/80 backdrop-blur-xl supports-backdrop-filter:bg-bg-primary/60">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan-glow/50 to-transparent" />
            
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link 
                    href="/" 
                    className="group flex items-center gap-2.5 font-bold text-xl transition-all duration-300 hover:scale-[1.02]"
                >
                    <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-linear-to-br from-cyan-glow/20 to-purple-neon/20 border border-cyan-glow/30 group-hover:border-cyan-glow/60 group-hover:shadow-glow-cyan transition-all duration-300">
                        <Zap className="w-5 h-5 text-cyan-glow group-hover:text-cyan-300 transition-colors" />
                        <div className="absolute inset-0 rounded-lg bg-cyan-glow/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-text-primary group-hover:text-cyan-glow transition-colors duration-300">
                        Bit<span className="text-cyan-glow">Loot</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => (
                        <Link 
                            key={link.label}
                            href={link.href} 
                            className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${
                                isActiveLink(link.href)
                                    ? 'text-cyan-glow bg-cyan-glow/10'
                                    : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary/50'
                            }`}
                        >
                            <span className="relative z-10">{link.label}</span>
                            {isActiveLink(link.href) && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cyan-glow rounded-full" />
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Search Bar (Desktop) */}
                <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
                    <div className="relative w-full group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-cyan-glow transition-colors" />
                        <Input
                            type="search"
                            placeholder="Search games, software, keys..."
                            aria-label="Search games and software"
                            className="w-full pl-10 pr-4 h-10 bg-bg-secondary/50 border-border-subtle focus:border-cyan-glow focus:ring-1 focus:ring-cyan-glow/20 text-text-primary placeholder:text-text-muted rounded-lg transition-all duration-200"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-focus-within:flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-bg-tertiary border border-border-subtle rounded">⌘K</kbd>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    {/* Mobile Search Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden text-text-muted hover:text-cyan-glow hover:bg-cyan-glow/10 transition-all duration-200"
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                    >
                        {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                        <span className="sr-only">Search</span>
                    </Button>

                    {/* Cart */}
                    <Link href="/cart">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="relative text-text-muted hover:text-cyan-glow hover:bg-cyan-glow/10 hover:shadow-glow-cyan-sm transition-all duration-200"
                        >
                            <ShoppingCart className="h-5 w-5" />
                            {itemCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-purple-neon text-white shadow-glow-purple-sm animate-scale-in">
                                    {itemCount > 99 ? '99+' : itemCount}
                                </span>
                            )}
                            <span className="sr-only">Cart{itemCount > 0 ? ` (${itemCount} items)` : ''}</span>
                        </Button>
                    </Link>

                    {/* User / Sign In / Dashboard */}
                    {isAuthenticated ? (
                        <>
                            <Link href="/profile" className="hidden sm:block">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="gap-2 border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow/60 hover:text-cyan-300 transition-all duration-200"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Dashboard</span>
                                </Button>
                            </Link>
                            {/* Mobile Dashboard Icon */}
                            <Link href="/profile" className="sm:hidden">
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-cyan-glow hover:bg-cyan-glow/10 transition-all duration-200"
                                >
                                    <LayoutDashboard className="h-5 w-5" />
                                    <span className="sr-only">Dashboard</span>
                                </Button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/login" className="hidden sm:block">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="gap-2 border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow/60 hover:text-cyan-300 transition-all duration-200"
                                >
                                    <User className="h-4 w-4" />
                                    <span>Sign In</span>
                                </Button>
                            </Link>
                            {/* Mobile User Icon */}
                            <Link href="/auth/login" className="sm:hidden">
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-text-muted hover:text-cyan-glow hover:bg-cyan-glow/10 transition-all duration-200"
                                >
                                    <User className="h-5 w-5" />
                                    <span className="sr-only">Account</span>
                                </Button>
                            </Link>
                        </>
                    )}

                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="lg:hidden text-text-muted hover:text-cyan-glow hover:bg-cyan-glow/10 transition-all duration-200"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent 
                            side="right" 
                            className="w-[300px] bg-bg-primary border-l border-border-subtle p-0"
                        >
                            {/* Mobile Menu Header */}
                            <div className="flex items-center gap-2 p-4 border-b border-border-subtle">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-glow/10 border border-cyan-glow/30">
                                    <Zap className="w-4 h-4 text-cyan-glow" />
                                </div>
                                <span className="font-bold text-text-primary">
                                    Bit<span className="text-cyan-glow">Loot</span>
                                </span>
                            </div>

                            {/* Mobile Menu Content */}
                            <div className="flex flex-col p-4 gap-1">
                                {navLinks.map((link) => (
                                    <SheetClose key={link.label} asChild>
                                        <Link 
                                            href={link.href} 
                                            className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                                                isActiveLink(link.href)
                                                    ? 'bg-cyan-glow/10 text-cyan-glow'
                                                    : 'text-text-muted hover:bg-bg-secondary hover:text-text-primary'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <link.icon className="w-5 h-5" />
                                                <span className="font-medium">{link.label}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 opacity-50" />
                                        </Link>
                                    </SheetClose>
                                ))}

                                {/* Divider */}
                                <div className="my-4 h-px bg-border-subtle" />

                                {/* Auth Section */}
                                {isAuthenticated ? (
                                    <div className="space-y-2">
                                        {/* User Info */}
                                        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-bg-secondary/50">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-glow/20 border border-cyan-glow/30">
                                                <User className="w-4 h-4 text-cyan-glow" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-text-primary truncate">
                                                    {user?.email ?? 'User'}
                                                </p>
                                                <p className="text-xs text-text-muted">
                                                    {user?.role === 'admin' ? 'Admin' : 'Member'}
                                                </p>
                                            </div>
                                        </div>

                                        <SheetClose asChild>
                                            <Link href="/dashboard">
                                                <Button 
                                                    variant="outline" 
                                                    className="w-full gap-2 border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow/60"
                                                >
                                                    <LayoutDashboard className="h-4 w-4" />
                                                    Dashboard
                                                </Button>
                                            </Link>
                                        </SheetClose>

                                        <SheetClose asChild>
                                            <Button 
                                                variant="ghost" 
                                                className="w-full gap-2 text-text-muted hover:text-red-400 hover:bg-red-400/10"
                                                onClick={() => logout()}
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Sign Out
                                            </Button>
                                        </SheetClose>
                                    </div>
                                ) : (
                                    <SheetClose asChild>
                                        <Link href="/auth/login">
                                            <Button 
                                                variant="outline" 
                                                className="w-full gap-2 border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow/60"
                                            >
                                                <User className="h-4 w-4" />
                                                Sign In
                                            </Button>
                                        </Link>
                                    </SheetClose>
                                )}

                                {/* Security Badge */}
                                <div className="mt-6 flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-green-success/10 border border-green-success/30">
                                    <Shield className="w-3.5 h-3.5 text-green-success" />
                                    <span className="text-xs text-green-success font-medium">Secure Crypto Payments</span>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Mobile Search Bar (Expandable) */}
            <div className={`lg:hidden border-t border-border-subtle overflow-hidden transition-all duration-300 ${
                isSearchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
            }`}>
                <div className="p-4 bg-bg-secondary/30">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-cyan-glow transition-colors" />
                        <Input
                            type="search"
                            placeholder="Search games, software, keys..."
                            aria-label="Search games and software"
                            className="w-full pl-10 h-10 bg-bg-primary border-border-subtle focus:border-cyan-glow focus:ring-1 focus:ring-cyan-glow/20 text-text-primary placeholder:text-text-muted rounded-lg"
                            autoFocus={isSearchOpen}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}
