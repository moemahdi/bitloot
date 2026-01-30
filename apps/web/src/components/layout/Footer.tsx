'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { 
    Zap, 
    Twitter, 
    MessageCircle, 
    Shield, 
    Bitcoin,
    Gamepad2,
    Package,
    Gift,
    RefreshCw,
    HelpCircle,
    FileText,
    RotateCcw,
    Mail,
    Search,
    Globe,
    Sparkles,
    ChevronRight,
    Loader2,
    CheckCircle2,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const socialLinks = [
    { href: 'https://twitter.com/bitloot', icon: Twitter, label: 'Twitter' },
    { href: 'https://discord.gg/bitloot', icon: MessageCircle, label: 'Discord' },
];

const shopLinks = [
    { href: '/catalog', label: 'All Products', icon: Package },
    { href: '/catalog?category=games', label: 'Games', icon: Gamepad2 },
    { href: '/catalog?category=software', label: 'Software', icon: Globe },
    { href: '/catalog?category=gift-cards', label: 'Gift Cards', icon: Gift },
    { href: '/catalog?category=subscriptions', label: 'Subscriptions', icon: RefreshCw },
];

const supportLinks = [
    { href: '/help', label: 'Help Center', icon: HelpCircle },
    { href: '/#faq', label: 'FAQs', icon: MessageCircle },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/order-lookup', label: 'Track Order', icon: Search },
];

const legalLinks = [
    { href: '/terms', label: 'Terms of Service', icon: FileText },
    { href: '/privacy', label: 'Privacy Policy', icon: Shield },
    { href: '/refunds', label: 'Refund Policy', icon: RotateCcw },
];

// Newsletter form component
interface NewsletterResponse {
    success: boolean;
    message?: string;
}

function NewsletterForm({ onSubscribed }: { onSubscribed?: () => void }): React.ReactElement | null {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [hasSubscribed, setHasSubscribed] = useState(false);

    // Check if already subscribed (persisted in localStorage)
    useEffect(() => {
        const subscribed = localStorage.getItem('newsletter_subscribed');
        if (subscribed === 'true') {
            setHasSubscribed(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (email === '' || status === 'loading') return;

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setStatus('error');
            setMessage('Please enter a valid email address');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch(`${API_BASE}/newsletter/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase().trim() }),
            });

            const data: NewsletterResponse = await response.json() as NewsletterResponse;

            if (response.ok && data.success) {
                setStatus('success');
                setMessage(data.message ?? 'Thanks for subscribing!');
                setEmail('');
                // Persist subscription status
                localStorage.setItem('newsletter_subscribed', 'true');
                // Show success message for 3 seconds before hiding
                setTimeout(() => {
                    setHasSubscribed(true);
                    onSubscribed?.();
                }, 3000);
            } else {
                setStatus('error');
                setMessage(data.message ?? 'Something went wrong. Please try again.');
            }
        } catch {
            setStatus('error');
            setMessage('Network error. Please try again.');
        }
    };

    // Hide form completely if already subscribed
    if (hasSubscribed) {
        return null;
    }

    // Show success message before hiding
    if (status === 'success') {
        return (
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-green-success/10 border border-green-success/30 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-green-success flex-shrink-0" />
                <span className="text-sm text-green-success font-medium">{message}</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-72">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted z-10 pointer-events-none" />
                <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === 'error') setStatus('idle');
                    }}
                    placeholder="Enter your email"
                    disabled={status === 'loading'}
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-bg-primary/80 backdrop-blur-sm border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                        status === 'error' 
                            ? 'border-orange-warning/50 focus:border-orange-warning focus:ring-orange-warning/20' 
                            : 'border-border-subtle focus:border-cyan-glow/50 focus:ring-cyan-glow/20'
                    }`}
                />
            </div>
            <button 
                type="submit"
                disabled={status === 'loading' || email === ''}
                className="group flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-xl bg-cyan-glow text-bg-primary font-semibold text-sm hover:shadow-glow-cyan hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
                {status === 'loading' ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Subscribing...
                    </>
                ) : (
                    <>
                        Subscribe
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                )}
            </button>
            {/* Error/Success message */}
            {message !== '' && status === 'error' && (
                <p className="text-xs mt-1 w-full text-center sm:hidden text-orange-warning">
                    {message}
                </p>
            )}
        </form>
    );
}

export function Footer(): React.ReactElement {
    const { isAuthenticated } = useAuth();
    const [hasSubscribed, setHasSubscribed] = useState(false);

    // Check if user has already subscribed to newsletter
    useEffect(() => {
        const subscribed = localStorage.getItem('newsletter_subscribed');
        if (subscribed === 'true') {
            setHasSubscribed(true);
        }
    }, []);
    
    return (
        <footer className="relative w-full border-t border-border-subtle bg-bg-primary">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan-glow/30 to-transparent" />
            
            {/* Newsletter Section - Only show for non-authenticated users who haven't subscribed */}
            {!isAuthenticated && !hasSubscribed && (
                <div className="bg-bg-secondary/30 border-b border-border-subtle">
                    <div className="container mx-auto px-4 md:px-6 py-8 md:py-10">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-glow/10 via-purple-neon/5 to-bg-secondary border border-cyan-glow/20 p-6 md:p-8">
                            {/* Background glow effects */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-glow/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-neon/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                            
                            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
                                <div className="text-center lg:text-left space-y-2">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-glow/10 border border-cyan-glow/30 mb-2">
                                        <Sparkles className="w-3.5 h-3.5 text-cyan-glow" />
                                        <span className="text-xs text-cyan-glow font-medium">Exclusive Deals</span>
                                    </div>
                                    <h4 className="text-xl md:text-2xl font-bold text-text-primary">
                                        Never Miss a Drop
                                    </h4>
                                    <p className="text-sm text-text-secondary max-w-md">
                                        Subscribe for early access to flash sales, new releases, and member-only discounts.
                                    </p>
                                </div>
                                <NewsletterForm onSubscribed={() => setHasSubscribed(true)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Main Footer Content */}
            <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
                    {/* Brand Column - Takes 2 columns on large screens */}
                    <div className="space-y-5 lg:col-span-2">
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
                        
                        <p className="text-sm text-text-secondary leading-relaxed max-w-sm">
                            Your trusted crypto gaming marketplace. Get instant access to game keys, software licenses, gift cards, and subscriptions. 
                            Pay with 300+ cryptocurrencies and receive your products in minutes, not days.
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

                        {/* Trust Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-success/10 border border-green-success/30">
                                <Shield className="w-3.5 h-3.5 text-green-success" />
                                <span className="text-xs text-green-success font-medium">Verified Seller</span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-neon/10 border border-purple-neon/30">
                                <Sparkles className="w-3.5 h-3.5 text-purple-neon" />
                                <span className="text-xs text-purple-neon font-medium">Authentic Keys</span>
                            </div>
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

                    {/* Legal & Payment Column */}
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
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-secondary border border-border-subtle">
                                    <Bitcoin className="w-4 h-4 text-orange-warning" />
                                    <span className="text-xs text-text-secondary font-medium">BTC</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-secondary border border-border-subtle">
                                    <span className="text-xs text-text-secondary font-medium">ETH</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-secondary border border-border-subtle">
                                    <span className="text-xs text-text-secondary font-medium">USDT</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-secondary border border-border-subtle text-cyan-glow">
                                    <span className="text-xs font-medium">+300</span>
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
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
