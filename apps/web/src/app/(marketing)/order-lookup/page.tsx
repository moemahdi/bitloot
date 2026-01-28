'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
    Search, 
    Package, 
    ArrowRight, 
    Shield, 
    Clock, 
    CheckCircle,
    AlertCircle,
    Loader2,
} from 'lucide-react';

// Design System Components
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Card, CardContent } from '@/design-system/primitives/card';
import { Label } from '@/design-system/primitives/label';

/**
 * Order Lookup Page
 * 
 * Allows guests to find their order by Order ID.
 * This is essential for crypto buyers who may not create accounts.
 */
export default function OrderLookupPage(): React.ReactElement {
    const router = useRouter();
    const [orderId, setOrderId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        setError(null);

        const trimmedOrderId = orderId.trim();
        if (trimmedOrderId === '') {
            setError('Please enter an order ID');
            return;
        }

        setIsLoading(true);
        // Navigate to order page
        router.push(`/orders/${trimmedOrderId}`);
    };

    return (
        <main className="min-h-screen bg-bg-primary">
            {/* Hero Section */}
            <section className="relative py-16 sm:py-24 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-linear-to-b from-cyan-glow/5 via-transparent to-transparent" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-glow/10 rounded-full blur-3xl" />
                <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-neon/10 rounded-full blur-3xl" />

                <div className="relative container mx-auto px-4 md:px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-12"
                    >
                        <Badge
                            variant="secondary"
                            className="mb-6 px-4 py-1.5 bg-cyan-glow/10 border border-cyan-glow/30 text-cyan-glow"
                        >
                            <Package className="w-4 h-4 mr-2" aria-hidden="true" />
                            Order Tracking
                        </Badge>

                        <h1 className="text-4xl sm:text-5xl font-display font-bold text-text-primary mb-6">
                            Track Your <span className="text-cyan-glow">Order</span>
                        </h1>

                        <p className="text-lg text-text-secondary max-w-xl mx-auto">
                            Enter your order ID to view your order status,
                            download your keys, or check delivery progress.
                        </p>
                    </motion.div>

                    {/* Lookup Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="max-w-lg mx-auto"
                    >
                        <Card className="bg-bg-secondary/80 backdrop-blur-sm border-border-subtle">
                            <CardContent className="p-6 sm:p-8">
                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="orderId" className="text-text-primary">
                                            Order ID
                                        </Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                            <Input
                                                id="orderId"
                                                type="text"
                                                placeholder="e.g., BL-ABC123XYZ"
                                                value={orderId}
                                                onChange={(e) => {
                                                    setOrderId(e.target.value);
                                                    if (error !== null) setError(null);
                                                }}
                                                className="h-12 pl-10 bg-bg-primary border-border-subtle focus:border-cyan-glow"
                                            />
                                        </div>
                                        <p className="text-xs text-text-muted">
                                            Find your order ID in the confirmation email we sent you.
                                        </p>
                                    </div>

                                    {/* Error Message */}
                                    {error !== null && error !== '' && (
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Searching...
                                            </>
                                        ) : (
                                            <>
                                                Track Order
                                                <ArrowRight className="w-5 h-5 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Trust Indicators */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
                    >
                        <div className="flex items-center gap-2 text-text-secondary">
                            <Shield className="w-5 h-5 text-green-success" />
                            <span className="text-sm">Secure & Private</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary">
                            <Clock className="w-5 h-5 text-cyan-glow" />
                            <span className="text-sm">Instant Access</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary">
                            <CheckCircle className="w-5 h-5 text-purple-neon" />
                            <span className="text-sm">No Account Required</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Help Section */}
            <section className="py-16 bg-bg-secondary">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="max-w-2xl mx-auto text-center">
                        <h2 className="text-xl font-display font-semibold text-text-primary mb-4">
                            Need Help?
                        </h2>
                        <p className="text-text-secondary mb-6">
                            If you can&apos;t find your order or have any issues, our support team
                            is available 24/7 to assist you.
                        </p>
                        <Button asChild variant="outline" className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10">
                            <a href="/support">Contact Support</a>
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    );
}
