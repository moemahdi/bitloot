'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Avatar, AvatarFallback } from '@/design-system/primitives/avatar';
import { Activity, Shield, Zap, CheckCircle } from 'lucide-react';

interface Purchase {
    id: string;
    initial: string;
    product: string;
    timeAgo: string;
}

const MOCK_PURCHASES: Purchase[] = [
    { id: '1', initial: 'J', product: 'Cyberpunk 2077', timeAgo: '2 minutes ago' },
    { id: '2', initial: 'M', product: 'Elden Ring', timeAgo: '5 minutes ago' },
    { id: '3', initial: 'A', product: 'Red Dead Redemption 2', timeAgo: '8 minutes ago' },
    { id: '4', initial: 'S', product: 'GTA V', timeAgo: '12 minutes ago' },
];

export function LivePurchaseFeed(): React.ReactElement {
    const [purchases, setPurchases] = useState(MOCK_PURCHASES);

    useEffect(() => {
        const interval = setInterval(() => {
            setPurchases((prev) => {
                const newPurchases = [...prev];
                newPurchases.unshift({
                    id: Date.now().toString(),
                    initial: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
                    product: ['Hogwarts Legacy', 'Starfield', 'Baldurs Gate 3', 'Spider-Man'][Math.floor(Math.random() * 4)],
                    timeAgo: 'Just now',
                });
                return newPurchases.slice(0, 4);
            });
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="bg-bg-tertiary border-border-accent">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                    <Activity className="text-green-success animate-pulse" />
                    Live Purchases
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <AnimatePresence mode="popLayout">
                    {purchases.map((purchase) => (
                        <motion.div
                            key={purchase.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            layout
                            className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-bg-secondary transition-colors"
                        >
                            <Avatar className="w-8 h-8 border border-cyan-glow/30">
                                <AvatarFallback className="bg-cyan-glow/10 text-cyan-glow text-xs font-semibold">
                                    {purchase.initial}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-primary truncate">
                                    <span className="font-semibold">Someone</span> purchased{' '}
                                    <span className="text-cyan-glow font-medium">{purchase.product}</span>
                                </p>
                                <p className="text-xs text-text-muted">{purchase.timeAgo}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

interface TrustBadgeProps {
    icon: typeof Shield;
    title: string;
    description: string;
}

export function TrustBadge({ icon: Icon, title, description }: TrustBadgeProps): React.ReactElement {
    return (
        <motion.div
            whileHover={{ x: 4 }}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-bg-secondary/50 transition-colors"
        >
            <div className="w-10 h-10 rounded-lg bg-cyan-glow/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-cyan-glow" />
            </div>
            <div className="flex-1">
                <h4 className="font-semibold text-white text-sm mb-1">{title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{description}</p>
            </div>
        </motion.div>
    );
}

export function TrustSection(): React.ReactElement {
    return (
        <Card className="bg-bg-tertiary border-border-accent">
            <CardHeader>
                <CardTitle className="text-white">Why BitLoot?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <TrustBadge
                    icon={Shield}
                    title="256-bit Encryption"
                    description="Bank-grade security for all transactions"
                />
                <TrustBadge
                    icon={Zap}
                    title="Instant Delivery"
                    description="Keys delivered in under 30 seconds"
                />
                <TrustBadge
                    icon={CheckCircle}
                    title="Verified Keys"
                    description="100% authentic from official sources"
                />
            </CardContent>
        </Card>
    );
}
