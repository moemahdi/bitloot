'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ConfettiProps {
    active: boolean;
    duration?: number;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    rotation: number;
    color: string;
    scale: number;
}

const colors = [
    'hsl(var(--cyan-glow))',
    'hsl(var(--purple-neon))',
    'hsl(var(--pink-featured))',
    'hsl(var(--green-success))',
];

export function Confetti({ active, duration = 3000 }: ConfettiProps): React.ReactElement {
    const particles = useRef<Particle[]>([]);

    useEffect(() => {
        if (active) {
            // Generate 50 particles
            particles.current = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: -10,
                rotation: Math.random() * 360,
                color: colors[Math.floor(Math.random() * colors.length)] ?? colors[0]!,
                scale: Math.random() * 0.5 + 0.5,
            }));
        }
    }, [active]);

    if (!active) return <></>;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.current.map((particle) => (
                <motion.div
                    key={particle.id}
                    initial={{
                        x: `${particle.x}vw`,
                        y: '-10vh',
                        rotate: 0,
                        opacity: 1,
                    }}
                    animate={{
                        y: '110vh',
                        rotate: particle.rotation * 3,
                        opacity: [1, 1, 0],
                    }}
                    transition={{
                        duration: duration / 1000,
                        ease: 'easeIn',
                        opacity: {
                            times: [0, 0.8, 1],
                        },
                    }}
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                    }}
                >
                    <div
                        style={{
                            width: `${8 * particle.scale}px`,
                            height: `${12 * particle.scale}px`,
                            backgroundColor: particle.color,
                            borderRadius: '2px',
                        }}
                    />
                </motion.div>
            ))}
        </div>
    );
}
