'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export type PaymentStatus = 'idle' | 'waiting' | 'confirming' | 'confirmed' | 'failed';

interface PaymentStatusTrackerProps {
    status: PaymentStatus;
    message?: string;
}

const statusConfig = {
    idle: {
        icon: Clock,
        color: 'text-text-muted',
        bgColor: 'bg-bg-tertiary',
        label: 'Ready to Pay',
    },
    waiting: {
        icon: Loader2,
        color: 'text-cyan-glow',
        bgColor: 'bg-cyan-glow/10',
        label: 'Waiting for Payment',
    },
    confirming: {
        icon: Loader2,
        color: 'text-purple-neon',
        bgColor: 'bg-purple-neon/10',
        label: 'Confirming Transaction',
    },
    confirmed: {
        icon: CheckCircle,
        color: 'text-green-success',
        bgColor: 'bg-green-success/10',
        label: 'Payment Confirmed',
    },
    failed: {
        icon: AlertTriangle,
        color: 'text-orange-warning',
        bgColor: 'bg-orange-warning/10',
        label: 'Payment Failed',
    },
};

export function PaymentStatusTracker({
    status,
    message,
}: PaymentStatusTrackerProps): React.ReactElement {
    const config = statusConfig[status];
    const Icon = config.icon;
    const isLoading = status === 'waiting' || status === 'confirming';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto"
        >
            <div
                className={`rounded-lg border border-border-subtle p-6 ${config.bgColor} backdrop-blur-sm`}
            >
                <div className="flex items-center gap-4">
                    {/* Icon with animation */}
                    <div className="relative">
                        <motion.div
                            animate={
                                isLoading
                                    ? {
                                        rotate: 360,
                                        scale: [1, 1.1, 1],
                                    }
                                    : status === 'confirmed'
                                        ? {
                                            scale: [0, 1.2, 1],
                                        }
                                        : {}
                            }
                            transition={
                                isLoading
                                    ? {
                                        rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                                        scale: { duration: 1.5, repeat: Infinity },
                                    }
                                    : {
                                        duration: 0.5,
                                        type: 'spring',
                                    }
                            }
                        >
                            <Icon className={`w-8 h-8 ${config.color}`} />
                        </motion.div>

                        {/* Pulsing ring for loading states */}
                        <AnimatePresence>
                            {isLoading && (
                                <motion.div
                                    initial={{ scale: 1, opacity: 0.5 }}
                                    animate={{ scale: 1.5, opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className={`absolute inset-0 rounded-full border-2 ${status === 'waiting' ? 'border-cyan-glow' : 'border-purple-neon'
                                        }`}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Status text */}
                    <div className="flex-1">
                        <h3 className={`text-lg font-display font-semibold ${config.color}`}>
                            {config.label}
                        </h3>
                        {message && <p className="text-sm text-text-secondary mt-1">{message}</p>}
                    </div>
                </div>

                {/* Progress steps for confirming state */}
                {status === 'confirming' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 space-y-2"
                    >
                        <ProgressStep label="Validating transaction" completed />
                        <ProgressStep label="Checking blockchain" inProgress />
                        <ProgressStep label="Finalizing order" />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

interface ProgressStepProps {
    label: string;
    completed?: boolean;
    inProgress?: boolean;
}

function ProgressStep({ label, completed, inProgress }: ProgressStepProps): React.ReactElement {
    return (
        <div className="flex items-center gap-2 text-sm">
            <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${completed
                        ? 'border-green-success bg-green-success'
                        : inProgress
                            ? 'border-cyan-glow bg-cyan-glow/20'
                            : 'border-border-subtle'
                    }`}
            >
                {completed && <CheckCircle className="w-3 h-3 text-white" />}
                {inProgress && (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 bg-cyan-glow rounded-full"
                    />
                )}
            </div>
            <span
                className={
                    completed || inProgress ? 'text-text-primary' : 'text-text-muted'
                }
            >
                {label}
            </span>
        </div>
    );
}
