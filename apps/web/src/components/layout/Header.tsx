'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Search, ShoppingCart, User, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/design-system/primitives/sheet';
import { useState } from 'react';

export function Header() {
    const pathname = usePathname();
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                    <span className="text-2xl">⚡</span>
                    BitLoot
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link href="/catalog" className="transition-colors hover:text-primary">
                        Catalog
                    </Link>
                    <Link href="/how-it-works" className="transition-colors hover:text-primary">
                        How it Works
                    </Link>
                    <Link href="/support" className="transition-colors hover:text-primary">
                        Support
                    </Link>
                </nav>

                {/* Search Bar (Desktop) */}
                <div className="hidden md:flex items-center flex-1 max-w-sm mx-6">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search games, software..."
                            className="w-full pl-8 bg-muted/50 focus:bg-background"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Mobile Search Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                    >
                        <Search className="h-5 w-5" />
                    </Button>

                    <Link href="/cart">
                        <Button variant="ghost" size="icon" className="relative">
                            <ShoppingCart className="h-5 w-5" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-secondary" />
                            <span className="sr-only">Cart</span>
                        </Button>
                    </Link>

                    <Link href="/auth/login">
                        <Button variant="ghost" size="icon">
                            <User className="h-5 w-5" />
                            <span className="sr-only">Account</span>
                        </Button>
                    </Link>

                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <div className="flex flex-col gap-4 mt-8">
                                <Link href="/catalog" className="text-lg font-medium">
                                    Catalog
                                </Link>
                                <Link href="/how-it-works" className="text-lg font-medium">
                                    How it Works
                                </Link>
                                <Link href="/support" className="text-lg font-medium">
                                    Support
                                </Link>
                                <hr className="my-2" />
                                <Link href="/auth/login" className="text-lg font-medium">
                                    Sign In
                                </Link>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Mobile Search Bar (Expandable) */}
            {isSearchOpen && (
                <div className="md:hidden border-t p-4 bg-background">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search..."
                            className="w-full pl-8"
                            autoFocus
                        />
                    </div>
                </div>
            )}
        </header>
    );
}
