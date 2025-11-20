'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Github } from 'lucide-react';

export function Footer() {
    return (
        <footer className="w-full border-t bg-background py-12 md:py-16 lg:py-20">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                            <span className="text-2xl">⚡</span>
                            BitLoot
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            The premier crypto-only marketplace for digital goods. Instant delivery, secure transactions, and anonymous purchasing.
                        </p>
                        <div className="flex gap-4">
                            <Link href="#" className="text-muted-foreground hover:text-primary">
                                <Twitter className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary">
                                <Facebook className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary">
                                <Instagram className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary">
                                <Github className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Shop</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link href="/catalog" className="hover:text-primary">
                                    All Products
                                </Link>
                            </li>
                            <li>
                                <Link href="/catalog?category=games" className="hover:text-primary">
                                    Games
                                </Link>
                            </li>
                            <li>
                                <Link href="/catalog?category=software" className="hover:text-primary">
                                    Software
                                </Link>
                            </li>
                            <li>
                                <Link href="/catalog?category=gift-cards" className="hover:text-primary">
                                    Gift Cards
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Support</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link href="/help" className="hover:text-primary">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="hover:text-primary">
                                    FAQs
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-primary">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/order-lookup" className="hover:text-primary">
                                    Track Order
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Legal</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link href="/terms" className="hover:text-primary">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="hover:text-primary">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/refunds" className="hover:text-primary">
                                    Refund Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} BitLoot. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
