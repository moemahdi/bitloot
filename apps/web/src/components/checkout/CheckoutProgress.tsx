'use client';

import { motion } from 'framer-motion';
import { Check, ShoppingCart, Mail, CreditCard, CheckCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type CheckoutStep = 'review' | 'email' | 'payment' | 'confirmation';

interface Step {
  id: CheckoutStep;
  label: string;
  icon: LucideIcon;
}

interface CheckoutProgressProps {
  currentStep: CheckoutStep;
}

const steps: Step[] = [
  { id: 'review', label: 'Review', icon: ShoppingCart },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'confirmation', label: 'Complete', icon: CheckCircle },
];

export function CheckoutProgress({ currentStep }: CheckoutProgressProps): React.ReactElement {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress bar background */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border-subtle" />
        
        {/* Animated progress bar fill */}
        <motion.div
          className="absolute top-5 left-0 h-0.5 bg-cyan-glow"
          initial={{ width: '0%' }}
          animate={{
            width: `${(currentIndex / (steps.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative flex flex-col items-center z-10">
              {/* Step circle */}
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  borderColor: isCompleted
                    ? 'hsl(var(--green-success))'
                    : isCurrent
                    ? 'hsl(var(--cyan-glow))'
                    : 'hsl(var(--border-subtle))',
                  backgroundColor: isCompleted
                    ? 'hsl(var(--green-success))'
                    : isCurrent
                    ? 'hsl(var(--bg-secondary))'
                    : 'hsl(var(--bg-tertiary))',
                }}
                transition={{ duration: 0.3 }}
                className="w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2"
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                ) : (
                  <Icon
                    className={`w-5 h-5 ${
                      isCurrent ? 'text-cyan-glow' : 'text-text-muted'
                    }`}
                  />
                )}
              </motion.div>

              {/* Step label */}
              <span
                className={`text-sm font-medium whitespace-nowrap ${
                  isCompleted
                    ? 'text-green-success'
                    : isCurrent
                    ? 'text-cyan-glow'
                    : 'text-text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
