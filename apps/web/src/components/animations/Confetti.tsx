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

// Helper for crypto-safe random numbers
function getRandomFloat(): number {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0]! / 4294967295;
}

function getRandomInt(max: number): number {
    return Math.floor(getRandomFloat() * max);
}

export function Confetti({ active, duration = 3000 }: ConfettiProps): React.ReactElement {
    const particles = useRef<Particle[]>([]);

    useEffect(() => {
        if (active) {
            // Generate 50 particles
            particles.current = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                x: getRandomFloat() * 100,
                y: -10,
                rotation: getRandomFloat() * 360,
                color: colors[getRandomInt(colors.length)] ?? colors[0]!,
                scale: getRandomFloat() * 0.5 + 0.5,
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
