'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Helper for crypto-safe random numbers
function getRandomFloat(): number {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0]! / 4294967295;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
}

export function FloatingParticles({ count = 30 }: { count?: number }): React.ReactElement {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const newParticles = Array.from({ length: count }, (_, i) => ({
            id: i,
            x: getRandomFloat() * 100,
            y: getRandomFloat() * 100,
            size: getRandomFloat() * 4 + 1,
            duration: getRandomFloat() * 20 + 10,
            delay: getRandomFloat() * 5,
        }));
        setParticles(newParticles);
    }, [count]);

    return (
        <div className="absolute inset-0 overflow-hidden">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-full bg-cyan-glow/20"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size,
                        height: particle.size,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0, 0.5, 0],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
}

export function AnimatedGridPattern(): React.ReactElement {
    return (
        <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        </div>
    );
}
