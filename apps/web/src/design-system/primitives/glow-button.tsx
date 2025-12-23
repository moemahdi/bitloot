'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/design-system/utils/utils';
import { Loader2 } from 'lucide-react';

const glowButtonVariants = cva(
    'relative inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-glow disabled:pointer-events-none disabled:opacity-50 overflow-hidden group',
    {
        variants: {
            variant: {
                default:
                    'bg-gradient-to-r from-cyan-glow to-cyan-500 text-bg-primary hover:from-cyan-400 hover:to-cyan-glow shadow-lg shadow-cyan-glow/25 hover:shadow-cyan-glow/50 hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700',
                secondary:
                    'bg-gradient-to-r from-purple-neon to-purple-500 text-white hover:from-purple-400 hover:to-purple-neon shadow-lg shadow-purple-neon/25 hover:shadow-purple-neon/50 hover:scale-[1.02] active:scale-[0.98]',
                success:
                    'bg-gradient-to-r from-green-success to-emerald-500 text-bg-primary hover:from-emerald-400 hover:to-green-success shadow-lg shadow-green-success/25 hover:shadow-green-success/50 hover:scale-[1.02] active:scale-[0.98]',
                outline:
                    'border-2 border-cyan-glow text-cyan-glow bg-transparent hover:bg-cyan-glow/10 shadow-lg shadow-cyan-glow/10 hover:shadow-cyan-glow/30 hover:scale-[1.02] active:scale-[0.98]',
                ghost: 'text-cyan-glow hover:bg-cyan-glow/10 hover:text-cyan-400',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-8 px-3 text-xs',
                lg: 'h-12 px-8 text-base',
                xl: 'h-14 px-10 text-lg',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface GlowButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glowButtonVariants> {
    asChild?: boolean;
    isLoading?: boolean;
    glowColor?: string;
}

const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
    ({ className, variant, size, asChild = false, isLoading = false, children, disabled, glowColor, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';

        return (
            <Comp
                className={cn(glowButtonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled ?? isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span className="opacity-70">Loading...</span>
                    </>
                ) : (
                    children
                )}
            </Comp>
        );
    }
);

GlowButton.displayName = 'GlowButton';

export { GlowButton, glowButtonVariants };
