'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Badge } from '@/design-system/primitives/badge';
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
    ChevronDown,
    LayoutDashboard,
    LogOut,
    Monitor,
    Gift,
    Flame,
    RefreshCw,
    // Game Genres
    Swords,
    Crosshair,
    Compass,
    Brain,
    Gauge,
    Skull,
    Trophy,
    Users,
    // Platforms
    Play,
    Laptop,
    Tv,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/design-system/primitives/sheet';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/CartContext';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface NavLink {
    href: string;
    label: string;
    icon: LucideIcon;
    badge?: string;
    highlight?: boolean;
    hasMegaMenu?: boolean;
}

interface GenreItem {
    id: string;
    label: string;
    icon: LucideIcon;
}

interface PlatformItem {
    id: string;
    label: string;
    icon: LucideIcon;
}

// Game genres for mega menu (these map to product.genres in the backend)
const GAME_GENRES: GenreItem[] = [
    { id: 'action', label: 'Action', icon: Swords },
    { id: 'shooter', label: 'Shooter', icon: Crosshair },
    { id: 'rpg', label: 'RPG', icon: Shield },
    { id: 'adventure', label: 'Adventure', icon: Compass },
    { id: 'strategy', label: 'Strategy', icon: Brain },
    { id: 'racing', label: 'Racing', icon: Gauge },
    { id: 'horror', label: 'Horror', icon: Skull },
    { id: 'sports', label: 'Sports', icon: Trophy },
    { id: 'mmo', label: 'MMO', icon: Users },
];

// Platforms for mega menu (these map to product.platform in the backend - must match PLATFORMS in catalog/types.ts)
const PLATFORMS: PlatformItem[] = [
    { id: 'Steam', label: 'Steam', icon: Play },
    { id: 'PlayStation', label: 'PlayStation', icon: Gamepad2 },
    { id: 'Xbox', label: 'Xbox', icon: Gamepad2 },
    { id: 'Nintendo', label: 'Nintendo', icon: Gamepad2 },
    { id: 'Epic', label: 'Epic Games', icon: Play },
    { id: 'Origin', label: 'EA / Origin', icon: Play },
    { id: 'Uplay', label: 'Ubisoft', icon: Play },
    { id: 'GOG', label: 'GOG', icon: Play },
];

// Main navigation links - properly filtered URLs matching catalog page
const NAV_LINKS: NavLink[] = [
    { 
        href: '/catalog?category=games', 
        label: 'Games', 
        icon: Gamepad2,
        hasMegaMenu: true,
    },
    { 
        href: '/catalog?category=software', 
        label: 'Software', 
        icon: Monitor,
    },
    { 
        href: '/catalog?category=subscriptions', 
        label: 'Subscriptions', 
        icon: RefreshCw,
    },
    { 
        href: '/catalog?category=gift-cards', 
        label: 'Gift Cards', 
        icon: Gift,
    },
    { 
        href: '/deals', 
        label: 'Deals', 
        icon: Flame,
        badge: '🔥',
        highlight: true,
    },
];



export function Header(): React.ReactElement {
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated, user, logout } = useAuth();
    const { itemCount } = useCart();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const megaMenuRef = useRef<HTMLDivElement>(null);
    const megaMenuTriggerRef = useRef<HTMLAnchorElement>(null);

    // Keyboard shortcut: ⌘K or Ctrl+K to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
                setTimeout(() => {
                    const searchInput = document.querySelector('input[type="search"]');
                    if (searchInput instanceof HTMLInputElement) {
                        searchInput.focus();
                    }
                }, 100);
            }
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
                setIsMegaMenuOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Close mega menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent): void => {
            if (
                megaMenuRef.current && 
                !megaMenuRef.current.contains(e.target as Node) &&
                megaMenuTriggerRef.current &&
                !megaMenuTriggerRef.current.contains(e.target as Node)
            ) {
                setIsMegaMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle search submission
    const handleSearch = (e: React.FormEvent): void => {
        e.preventDefault();
        if (searchQuery.trim() !== '') {
            router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setIsSearchOpen(false);
        }
    };

    // Check if link is active (handles query params)
    const isActiveLink = (href: string): boolean => {
        const [linkPath, linkQuery] = href.split('?');
        if (pathname !== linkPath) return false;
        if (linkQuery === undefined) return true;
        // For category links, check if current URL has matching category
        if (typeof window === 'undefined') return false;
        const urlParams = new URLSearchParams(window.location.search);
        const linkParams = new URLSearchParams(linkQuery);
        const linkCategory = linkParams.get('category');
        const urlCategory = urlParams.get('category');
        return linkCategory === urlCategory;
    };

    // Navigate to filtered catalog
    const navigateToFiltered = (params: Record<string, string>): void => {
        const searchParams = new URLSearchParams(params);
        router.push(`/catalog?${searchParams.toString()}`);
        setIsMegaMenuOpen(false);
    };

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

                {/* Desktop Navigation with Mega Menu */}
                <nav className="hidden md:flex items-center gap-1 relative">
                    {NAV_LINKS.map((link) => (
                        link.hasMegaMenu ? (
                            // Games link with mega menu
                            <div key={link.label} className="relative">
                                <Link 
                                    ref={megaMenuTriggerRef}
                                    href={link.href} 
                                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 group flex items-center gap-1 ${
                                        isActiveLink(link.href) || isMegaMenuOpen
                                            ? 'text-cyan-glow bg-cyan-glow/10'
                                            : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary/50'
                                    }`}
                                    onMouseEnter={() => setIsMegaMenuOpen(true)}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsMegaMenuOpen(!isMegaMenuOpen);
                                    }}
                                >
                                    <span className="relative z-10">{link.label}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
                                    {(isActiveLink(link.href) || isMegaMenuOpen) && (
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cyan-glow rounded-full" />
                                    )}
                                </Link>
                            </div>
                        ) : (
                            // Regular nav links
                            <Link 
                                key={link.label}
                                href={link.href} 
                                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 group flex items-center gap-1.5 ${
                                    link.highlight 
                                        ? 'text-orange-warning hover:text-orange-400 hover:bg-orange-warning/10' 
                                        : isActiveLink(link.href)
                                            ? 'text-cyan-glow bg-cyan-glow/10'
                                            : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary/50'
                                }`}
                            >
                                <span className="relative z-10">{link.label}</span>
                                {link.badge && (
                                    <span className="text-xs" aria-hidden="true">{link.badge}</span>
                                )}
                                {isActiveLink(link.href) && !link.highlight && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cyan-glow rounded-full" />
                                )}
                            </Link>
                        )
                    ))}
                </nav>

                {/* Games Mega Menu Dropdown */}
                {isMegaMenuOpen && (
                    <div 
                        ref={megaMenuRef}
                        className="absolute left-0 right-0 top-full mt-0 bg-bg-secondary/95 backdrop-blur-xl border-b border-border-subtle shadow-2xl z-50"
                        onMouseLeave={() => setIsMegaMenuOpen(false)}
                    >
                        <div className="container mx-auto px-4 md:px-6 py-6">
                            <div className="grid grid-cols-3 gap-8">
                                {/* Browse by Genre */}
                                <div>
                                    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Gamepad2 className="w-4 h-4" />
                                        Browse by Genre
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {GAME_GENRES.map((genre) => (
                                            <button
                                                key={genre.id}
                                                onClick={() => navigateToFiltered({ category: 'games', genre: genre.id })}
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-cyan-glow hover:bg-cyan-glow/10 rounded-lg transition-all duration-200 text-left"
                                            >
                                                <genre.icon className="w-4 h-4" />
                                                <span>{genre.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Browse by Platform */}
                                <div>
                                    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Tv className="w-4 h-4" />
                                        Browse by Platform
                                    </h3>
                                    <div className="space-y-1">
                                        {PLATFORMS.map((platform) => (
                                            <button
                                                key={platform.id}
                                                onClick={() => navigateToFiltered({ category: 'games', platform: platform.id })}
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-cyan-glow hover:bg-cyan-glow/10 rounded-lg transition-all duration-200 w-full text-left"
                                            >
                                                <platform.icon className="w-4 h-4" />
                                                <span>{platform.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Links */}
                                <div>
                                    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Flame className="w-4 h-4" />
                                        Popular
                                    </h3>
                                    <div className="space-y-2">
                                        <Link
                                            href="/catalog?category=games&sort=rating"
                                            onClick={() => setIsMegaMenuOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-cyan-glow hover:bg-cyan-glow/10 rounded-lg transition-all duration-200"
                                        >
                                            <Trophy className="w-4 h-4 text-yellow-500" />
                                            <span>Top Rated</span>
                                        </Link>
                                        <Link
                                            href="/catalog?category=games&sort=newest"
                                            onClick={() => setIsMegaMenuOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-cyan-glow hover:bg-cyan-glow/10 rounded-lg transition-all duration-200"
                                        >
                                            <Zap className="w-4 h-4 text-cyan-glow" />
                                            <span>New Releases</span>
                                        </Link>
                                        <Link
                                            href="/deals"
                                            onClick={() => setIsMegaMenuOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-orange-warning hover:text-orange-400 hover:bg-orange-warning/10 rounded-lg transition-all duration-200"
                                        >
                                            <Flame className="w-4 h-4" />
                                            <span>Hot Deals</span>
                                            <Badge variant="secondary" className="bg-orange-warning/20 text-orange-warning border-orange-warning/30 text-[10px] px-1.5">
                                                SALE
                                            </Badge>
                                        </Link>
                                    </div>

                                    {/* View All Games Button */}
                                    <div className="mt-6 pt-4 border-t border-border-subtle">
                                        <Link
                                            href="/catalog?category=games"
                                            onClick={() => setIsMegaMenuOpen(false)}
                                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-cyan-glow bg-cyan-glow/10 hover:bg-cyan-glow/20 border border-cyan-glow/30 rounded-lg transition-all duration-200"
                                        >
                                            <span>View All Games</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search Bar (Desktop) */}
                <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
                    <form onSubmit={handleSearch} className="relative w-full group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-cyan-glow transition-colors" />
                        <Input
                            type="search"
                            placeholder="Search games, software, keys..."
                            aria-label="Search games and software"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 h-10 bg-bg-secondary/50 border-border-subtle focus:border-cyan-glow focus:ring-1 focus:ring-cyan-glow/20 text-text-primary placeholder:text-text-muted rounded-lg transition-all duration-200"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-focus-within:flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-bg-tertiary border border-border-subtle rounded">⌘K</kbd>
                        </div>
                    </form>
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
                                {/* Main Nav Links */}
                                {NAV_LINKS.map((link) => (
                                    <SheetClose key={link.label} asChild>
                                        <Link 
                                            href={link.href} 
                                            className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                                                link.highlight 
                                                    ? 'bg-orange-warning/10 text-orange-warning hover:bg-orange-warning/20'
                                                    : isActiveLink(link.href)
                                                        ? 'bg-cyan-glow/10 text-cyan-glow'
                                                        : 'text-text-muted hover:bg-bg-secondary hover:text-text-primary'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <link.icon className="w-5 h-5" />
                                                <span className="font-medium">{link.label}</span>
                                                {link.badge && (
                                                    <span className="text-xs" aria-hidden="true">{link.badge}</span>
                                                )}
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
                    <form onSubmit={handleSearch} className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-cyan-glow transition-colors" />
                        <Input
                            type="search"
                            placeholder="Search games, software, keys..."
                            aria-label="Search games and software"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 h-10 bg-bg-primary border-border-subtle focus:border-cyan-glow focus:ring-1 focus:ring-cyan-glow/20 text-text-primary placeholder:text-text-muted rounded-lg"
                            autoFocus={isSearchOpen}
                        />
                    </form>
                </div>
            </div>
        </header>
    );
}
