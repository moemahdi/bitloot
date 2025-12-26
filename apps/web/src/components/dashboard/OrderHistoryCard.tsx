'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, CreditCard, ExternalLink, Package, Store, Crown } from 'lucide-react';
import { Card } from '@/design-system/primitives/card';
import { Badge } from '@/design-system/primitives/badge';
import { GlowButton } from '@/design-system/primitives/glow-button';
import type { OrderResponseDto } from '@bitloot/sdk';

interface OrderHistoryCardProps {
    order: OrderResponseDto;
    index: number;
}

export function OrderHistoryCard({ order, index }: OrderHistoryCardProps): React.ReactElement {
    const statusColor =
        order.status === 'fulfilled'
            ? 'green'
            : order.status === 'pending'
                ? 'orange'
                : 'red';

    const statusVariant =
        order.status === 'fulfilled'
            ? 'default'
            : order.status === 'pending'
                ? 'secondary'
                : 'destructive';

    // Source type badge styling
    const sourceType = order.sourceType ?? 'custom';
    const isKinguin = sourceType === 'kinguin';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
            <Card className="group relative overflow-hidden border-cyan-glow/20 bg-bg-secondary/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-glow/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]">
                {/* Glow Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-glow/0 via-cyan-glow/10 to-purple-glow/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-cyan-glow" />
                                <span className="font-mono text-xs text-text-secondary">ORDER ID</span>
                            </div>
                            <p className="font-mono text-sm font-bold text-text-primary tracking-wider">
                                {order.id.slice(0, 8)}...{order.id.slice(-4)}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Badge
                                variant={statusVariant}
                                className={`
                ${statusColor === 'green'
                                        ? 'bg-green-success/20 text-green-success border-green-success/30 shadow-[0_0_8px_rgba(57,255,20,0.2)]'
                                        : statusColor === 'orange'
                                            ? 'bg-orange-500/20 text-orange-500 border-orange-500/30'
                                            : 'bg-red-500/20 text-red-500 border-red-500/30'
                                    }
                uppercase tracking-wider font-bold
              `}
                            >
                                {order.status}
                            </Badge>
                            {/* Source Type Badge */}
                            <Badge
                                variant="outline"
                                className={`text-xs ${isKinguin
                                        ? 'border-orange-500/30 text-orange-400 bg-orange-500/5'
                                        : 'border-cyan-glow/30 text-cyan-glow bg-cyan-glow/5'
                                    }`}
                            >
                                {isKinguin ? (
                                    <>
                                        <Crown className="mr-1 h-3 w-3" />
                                        Kinguin
                                    </>
                                ) : (
                                    <>
                                        <Store className="mr-1 h-3 w-3" />
                                        Custom
                                    </>
                                )}
                            </Badge>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-glow/20 to-transparent" />

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-text-secondary">
                                <Calendar className="h-3 w-3" />
                                <span className="text-xs">DATE</span>
                            </div>
                            <p className="text-sm font-medium text-text-primary">
                                {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="space-y-1 text-right">
                            <div className="flex items-center justify-end gap-2 text-text-secondary">
                                <CreditCard className="h-3 w-3" />
                                <span className="text-xs">TOTAL</span>
                            </div>
                            <p className="text-lg font-bold text-cyan-glow font-mono">
                                {order.total} <span className="text-xs text-text-secondary">CRYPTO</span>
                            </p>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="pt-2">
                        <Link href={`/orders/${order.id}`} className="block w-full">
                            <GlowButton
                                variant="outline"
                                className="w-full group-hover:bg-cyan-glow/5 border-cyan-glow/30 text-cyan-glow hover:text-cyan-glow"
                                glowColor="cyan"
                            >
                                View Details
                                <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </GlowButton>
                        </Link>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
