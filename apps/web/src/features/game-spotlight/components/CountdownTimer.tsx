'use client';

/**
 * CountdownTimer Component
 *
 * Displays a countdown to a target date with days, hours, minutes, seconds.
 * Animated number transitions with neon accent styling.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: Date;
  accentColor?: string;
  onComplete?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - Date.now();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function TimeUnit({
  value,
  label,
  accentColor,
}: {
  value: number;
  label: string;
  accentColor: string;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex h-16 w-16 items-center justify-center rounded-lg border bg-bg-secondary/80 backdrop-blur-sm md:h-20 md:w-20"
        style={{
          borderColor: `${accentColor}40`,
          boxShadow: `0 0 15px ${accentColor}20`,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={value}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="text-2xl font-bold md:text-3xl"
            style={{ color: accentColor }}
          >
            {String(value).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-2 text-xs uppercase tracking-wider text-text-muted">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer({
  targetDate,
  accentColor = '#00D9FF',
  onComplete,
}: CountdownTimerProps): React.JSX.Element {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const initial = calculateTimeLeft(targetDate);
    setTimeLeft(initial);

    if (
      initial.days === 0 &&
      initial.hours === 0 &&
      initial.minutes === 0 &&
      initial.seconds === 0
    ) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);

      if (
        newTimeLeft.days === 0 &&
        newTimeLeft.hours === 0 &&
        newTimeLeft.minutes === 0 &&
        newTimeLeft.seconds === 0
      ) {
        setIsComplete(true);
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (isComplete) {
    return (
      <div
        className="text-xl font-semibold"
        style={{ color: accentColor }}
      >
        Available Now!
      </div>
    );
  }

  return (
    <div className="flex gap-3 md:gap-4">
      <TimeUnit value={timeLeft.days} label="Days" accentColor={accentColor} />
      <div className="flex items-center text-2xl text-text-muted">:</div>
      <TimeUnit value={timeLeft.hours} label="Hours" accentColor={accentColor} />
      <div className="flex items-center text-2xl text-text-muted">:</div>
      <TimeUnit value={timeLeft.minutes} label="Minutes" accentColor={accentColor} />
      <div className="flex items-center text-2xl text-text-muted">:</div>
      <TimeUnit value={timeLeft.seconds} label="Seconds" accentColor={accentColor} />
    </div>
  );
}
