'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/design-system/utils/utils';
import { Loader2 } from 'lucide-react';

const glowButtonVariants = cva(
    'relative inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden group',
    {
        variants: {
            variant: {
                default:
                    'bg-cyan-glow text-black hover:bg-cyan-glow/90 shadow-lg shadow-cyan-glow/20 hover:shadow-cyan-glow/40 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700',
                secondary:
                    'bg-purple-neon text-white hover:bg-purple-neon/90 shadow-lg shadow-purple-neon/20 hover:shadow-purple-neon/40',
                success:
                    'bg-green-success text-black hover:bg-green-success/90 shadow-lg shadow-green-success/20 hover:shadow-green-success/40',
                outline:
                    'border-2 border-cyan-glow text-cyan-glow hover:bg-cyan-glow/10 shadow-lg shadow-cyan-glow/10 hover:shadow-cyan-glow/30',
                ghost: 'text-cyan-glow hover:bg-cyan-glow/10',
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
