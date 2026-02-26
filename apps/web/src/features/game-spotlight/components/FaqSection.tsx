'use client';

/**
 * FaqSection Component
 *
 * Accordion-style FAQ section for the spotlight page.
 * Uses Radix UI Accordion primitives with neon styling.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/design-system/utils/utils';
import type { FaqItem } from '../types';

interface FaqSectionProps {
  items: FaqItem[];
  accentColor?: string;
}

interface FaqItemProps {
  item: FaqItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  accentColor: string;
}

function FaqItemComponent({
  item,
  index,
  isOpen,
  onToggle,
  accentColor,
}: FaqItemProps): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-border-subtle"
    >
      <button
        onClick={onToggle}
        className={cn(
          'group flex w-full items-center justify-between py-5 text-left transition-colors',
          isOpen ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary',
        )}
        aria-expanded={isOpen}
      >
        <span className="pr-4 text-base font-medium">{item.question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
          style={{ color: isOpen ? accentColor : undefined }}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-5 text-sm leading-relaxed text-text-secondary">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FaqSection({
  items,
  accentColor = '#00D9FF',
}: FaqSectionProps): React.JSX.Element {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) {
    return <div />;
  }

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12">
      <h2 className="mb-8 text-2xl font-bold text-text-primary">
        Frequently Asked Questions
      </h2>
      <div className="rounded-xl border border-border-subtle bg-bg-secondary/30 px-6 backdrop-blur-sm">
        {items.map((item, index) => (
          <FaqItemComponent
            key={index}
            item={item}
            index={index}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
            accentColor={accentColor}
          />
        ))}
      </div>
    </section>
  );
}
