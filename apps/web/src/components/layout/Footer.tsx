'use client';

import Link from 'next/link';
import { 
    Zap, 
    Twitter, 
    MessageCircle, 
    Github, 
    Shield, 
    Bitcoin,
    Gamepad2,
    Package,
    CreditCard,
    HelpCircle,
    FileText,
    RotateCcw,
    Mail,
    Search
} from 'lucide-react';

const socialLinks = [
    { href: 'https://twitter.com/bitloot', icon: Twitter, label: 'Twitter' },
    { href: 'https://discord.gg/bitloot', icon: MessageCircle, label: 'Discord' },
    { href: 'https://github.com/bitloot', icon: Github, label: 'GitHub' },
];

const shopLinks = [
    { href: '/catalog', label: 'All Products', icon: Package },
    { href: '/catalog?category=games', label: 'Games', icon: Gamepad2 },
    { href: '/catalog?category=software', label: 'Software', icon: CreditCard },
    { href: '/catalog?category=gift-cards', label: 'Gift Cards', icon: CreditCard },
];

const supportLinks = [
    { href: '/help', label: 'Help Center', icon: HelpCircle },
    { href: '/faq', label: 'FAQs', icon: MessageCircle },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/order-lookup', label: 'Track Order', icon: Search },
];

const legalLinks = [
    { href: '/terms', label: 'Terms of Service', icon: FileText },
    { href: '/privacy', label: 'Privacy Policy', icon: Shield },
    { href: '/refunds', label: 'Refund Policy', icon: RotateCcw },
];

export function Footer(): React.ReactElement {
    return (
        <footer className="relative w-full border-t border-border-subtle bg-bg-primary">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan-glow/30 to-transparent" />
            
            {/* Main Footer Content */}
            <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand Column */}
                    <div className="space-y-5">
                        <Link 
                            href="/" 
                            className="group inline-flex items-center gap-2.5 font-bold text-xl transition-all duration-300"
                        >
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-linear-to-br from-cyan-glow/20 to-purple-neon/20 border border-cyan-glow/30 group-hover:border-cyan-glow/60 group-hover:shadow-glow-cyan-sm transition-all duration-300">
                                <Zap className="w-5 h-5 text-cyan-glow" />
                            </div>
                            <span className="text-text-primary group-hover:text-cyan-glow transition-colors">
                                Bit<span className="text-cyan-glow">Loot</span>
                            </span>
                        </Link>
                        
                        <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                            The premier crypto-only marketplace for digital goods. Instant delivery, secure transactions, and privacy-first purchasing.
                        </p>
                        
                        {/* Social Links */}
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social) => (
                                <Link 
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-bg-secondary border border-border-subtle text-text-muted hover:text-cyan-glow hover:border-cyan-glow/50 hover:bg-cyan-glow/10 hover:shadow-glow-cyan-sm transition-all duration-200"
                                    aria-label={social.label}
                                >
                                    <social.icon className="h-4 w-4" />
                                </Link>
                            ))}
                        </div>

                        {/* Trust Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-success/10 border border-green-success/30">
                            <Shield className="w-3.5 h-3.5 text-green-success" />
                            <span className="text-xs text-green-success font-medium">Secure Crypto Payments</span>
                        </div>
                    </div>

                    {/* Shop Column */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                            Shop
                        </h3>
                        <ul className="space-y-2.5">
                            {shopLinks.map((link) => (
                                <li key={link.href}>
                                    <Link 
                                        href={link.href} 
                                        className="group inline-flex items-center gap-2 text-sm text-text-secondary hover:text-cyan-glow transition-colors duration-200"
                                    >
                                        <link.icon className="w-3.5 h-3.5 text-text-muted group-hover:text-cyan-glow transition-colors" />
                                        <span>{link.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Column */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                            Support
                        </h3>
                        <ul className="space-y-2.5">
                            {supportLinks.map((link) => (
                                <li key={link.href}>
                                    <Link 
                                        href={link.href} 
                                        className="group inline-flex items-center gap-2 text-sm text-text-secondary hover:text-cyan-glow transition-colors duration-200"
                                    >
                                        <link.icon className="w-3.5 h-3.5 text-text-muted group-hover:text-cyan-glow transition-colors" />
                                        <span>{link.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Column */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                            Legal
                        </h3>
                        <ul className="space-y-2.5">
                            {legalLinks.map((link) => (
                                <li key={link.href}>
                                    <Link 
                                        href={link.href} 
                                        className="group inline-flex items-center gap-2 text-sm text-text-secondary hover:text-cyan-glow transition-colors duration-200"
                                    >
                                        <link.icon className="w-3.5 h-3.5 text-text-muted group-hover:text-cyan-glow transition-colors" />
                                        <span>{link.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        {/* Payment Methods */}
                        <div className="pt-4 space-y-3">
                            <p className="text-xs text-text-muted uppercase tracking-wider">
                                We Accept
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bg-secondary border border-border-subtle">
                                    <Bitcoin className="w-4 h-4 text-orange-warning" />
                                    <span className="text-xs text-text-secondary font-medium">BTC</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bg-secondary border border-border-subtle">
                                    <span className="text-xs text-text-secondary font-medium">300+ Cryptos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-border-subtle">
                <div className="container mx-auto px-4 md:px-6 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-text-muted">
                            &copy; {new Date().getFullYear()} BitLoot. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4 text-sm text-text-muted">
                            <Link href="/terms" className="hover:text-cyan-glow transition-colors">
                                Terms
                            </Link>
                            <span className="text-border-subtle">•</span>
                            <Link href="/privacy" className="hover:text-cyan-glow transition-colors">
                                Privacy
                            </Link>
                            <span className="text-border-subtle">•</span>
                            <Link href="/cookies" className="hover:text-cyan-glow transition-colors">
                                Cookies
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
