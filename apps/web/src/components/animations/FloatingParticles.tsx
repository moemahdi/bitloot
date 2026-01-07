'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

// Helper for crypto-safe random numbers
function getRandomFloat(): number {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0]! / 4294967295;
}

// Neon color variants for particles - matches BitLoot design system
type ParticleColor = 'cyan' | 'purple' | 'pink';

const PARTICLE_COLORS: Record<ParticleColor, string> = {
    cyan: 'bg-cyan-glow/30 shadow-glow-cyan-sm',
    purple: 'bg-purple-neon/25 shadow-glow-purple-sm',
    pink: 'bg-pink-featured/20',
} as const;

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    color: ParticleColor;
    maxOpacity: number;
}

interface FloatingParticlesProps {
    /** Number of particles to render */
    count?: number;
    /** Enable multi-color particles (cyan, purple, pink) */
    multiColor?: boolean;
    /** Base animation speed multiplier (lower = slower) */
    speed?: number;
}

export function FloatingParticles({
    count = 30,
    multiColor = true,
    speed = 1,
}: FloatingParticlesProps): React.ReactElement {
    const [particles, setParticles] = useState<Particle[]>([]);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        const colors: ParticleColor[] = multiColor
            ? ['cyan', 'cyan', 'cyan', 'purple', 'purple', 'pink'] // Weighted toward cyan
            : ['cyan'];

        const newParticles = Array.from({ length: count }, (_, i) => ({
            id: i,
            x: getRandomFloat() * 100,
            y: getRandomFloat() * 100,
            size: getRandomFloat() * 4 + 2, // 2-6px particles
            duration: (getRandomFloat() * 15 + 10) / speed, // 10-25s adjusted by speed
            delay: getRandomFloat() * 8,
            color: colors[Math.floor(getRandomFloat() * colors.length)]!,
            maxOpacity: getRandomFloat() * 0.4 + 0.2, // 0.2-0.6 opacity range
        }));
        setParticles(newParticles);
    }, [count, multiColor, speed]);

    // Don't render animations if user prefers reduced motion
    if (prefersReducedMotion === true) {
        return (
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                {particles.slice(0, 10).map((particle) => (
                    <div
                        key={particle.id}
                        className={`absolute rounded-full ${PARTICLE_COLORS[particle.color]}`}
                        style={{
                            left: `${particle.x}%`,
                            top: `${particle.y}%`,
                            width: particle.size,
                            height: particle.size,
                            opacity: particle.maxOpacity * 0.5,
                        }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className={`absolute rounded-full ${PARTICLE_COLORS[particle.color]}`}
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size,
                        height: particle.size,
                    }}
                    animate={{
                        y: [0, -40, 0],
                        x: [0, getRandomFloat() * 10 - 5, 0], // Subtle horizontal drift
                        opacity: [0, particle.maxOpacity, 0],
                        scale: [0.8, 1.1, 0.8],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                        ease: [0.4, 0, 0.2, 1], // CSS cubic-bezier(0.4, 0, 0.2, 1) - smooth easing
                    }}
                />
            ))}
        </div>
    );
}

interface AnimatedGridPatternProps {
    /** Grid cell size in pixels */
    cellSize?: number;
    /** Grid line opacity (0-1) */
    opacity?: number;
}

export function AnimatedGridPattern({
    cellSize = 50,
    opacity = 0.04,
}: AnimatedGridPatternProps = {}): React.ReactElement {
    const prefersReducedMotion = useReducedMotion();

    // Memoize the gradient style to prevent recalculation
    const gridStyle = useMemo(
        () => ({
            backgroundImage: `
                linear-gradient(hsl(var(--cyan-glow) / ${opacity}) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--cyan-glow) / ${opacity}) 1px, transparent 1px)
            `,
            backgroundSize: `${cellSize}px ${cellSize}px`,
        }),
        [cellSize, opacity]
    );

    return (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            {/* Base grid layer */}
            <div
                className="absolute inset-0 mask-[radial-gradient(ellipse_80%_80%_at_50%_50%,black_20%,transparent_100%)]"
                style={gridStyle}
            />

            {/* Subtle animated glow overlay - only if motion is allowed */}
            {prefersReducedMotion === false && (
                <motion.div
                    className="absolute inset-0 bg-gradient-radial from-cyan-glow/5 via-transparent to-transparent"
                    style={{
                        background:
                            'radial-gradient(ellipse 60% 40% at 50% 50%, hsl(var(--cyan-glow) / 0.03), transparent 70%)',
                    }}
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            )}
        </div>
    );
}

/**
 * Combined background effect with particles and grid
 * Use this for hero sections and landing pages
 */
export function SpaceBackground({
    particleCount = 40,
    showGrid = true,
}: {
    particleCount?: number;
    showGrid?: boolean;
}): React.ReactElement {
    return (
        <div className="absolute inset-0 -z-10 overflow-hidden bg-bg-primary" aria-hidden="true">
            {showGrid && <AnimatedGridPattern />}
            <FloatingParticles count={particleCount} multiColor speed={0.8} />

            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-bg-primary/50 to-bg-primary" />
        </div>
    );
}
