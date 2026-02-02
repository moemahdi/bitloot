/**
 * FormattedDescription Component
 * 
 * Intelligently parses and formats raw product descriptions that come from
 * various sources (like Kinguin API) without proper formatting.
 * 
 * Features:
 * - Detects quotes with attributions
 * - Breaks long text into readable paragraphs
 * - Adds proper spacing after sentences
 */
'use client';

import React from 'react';
import { cn } from '@/design-system/utils/utils';
import { Quote } from 'lucide-react';

interface FormattedDescriptionProps {
  text: string;
  className?: string;
}

interface ParsedSection {
  type: 'paragraph' | 'quote';
  content: string;
  attribution?: string;
}

/**
 * Patterns to remove from text (boilerplate from Kinguin API, etc.)
 */
const BOILERPLATE_PATTERNS = [
  /PS5\s*instruction\s*PS4\s*instruction/gi,
  /PS4\s*instruction\s*PS5\s*instruction/gi,
  /^\s*PS[45]\s*instruction\s*$/gim,
  // Remove duplicated "Log into the account" phrases
  /(?:Log\s*into\s*the\s*account\s-*){2,}/gi,
];

/**
 * Clean text by removing known boilerplate patterns
 */
function cleanBoilerplate(text: string): string {
  let cleaned = text;
  for (const pattern of BOILERPLATE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  // Clean up any resulting double spaces or leading/trailing whitespace
  return cleaned.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Split long text into readable paragraphs based on sentence structure
 */
function splitIntoReadableParagraphs(text: string): string[] {
  // Clean up whitespace
  const cleaned = text.replace(/\s+/g, ' ').trim();
  
  // If text is short, return as is
  if (cleaned.length < 200) {
    return [cleaned];
  }
  
  const paragraphs: string[] = [];
  const sentences = cleaned.split(/(?<=[.!?])\s+(?=[A-Z])/);
  
  let currentPara = '';
  
  for (const sentence of sentences) {
    // If adding this sentence would make paragraph too long, start a new one
    if (currentPara.length > 0 && currentPara.length + sentence.length > 300) {
      paragraphs.push(currentPara.trim());
      currentPara = sentence;
    } else {
      currentPara += (currentPara !== '' ? ' ' : '') + sentence;
    }
  }
  
  // Don't forget the last paragraph
  if (currentPara.trim() !== '') {
    paragraphs.push(currentPara.trim());
  }
  
  return paragraphs.length > 0 ? paragraphs : [cleaned];
}

/**
 * Parse raw description text into structured sections
 */
function parseDescription(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  // Clean boilerplate text first
  let remaining = cleanBoilerplate(text.trim());
  
  // If nothing left after cleaning, return empty
  if (remaining === '') {
    return sections;
  }
  
  // 1. Check for quote at the end
  const quoteMatch = remaining.match(/"([^"]+)"\s*[–—-]\s*(.+?)$/);
  let quoteSection: ParsedSection | null = null;
  if (quoteMatch?.index !== undefined && quoteMatch[1] !== undefined && quoteMatch[1] !== '' && quoteMatch[2] !== undefined && quoteMatch[2] !== '') {
    quoteSection = {
      type: 'quote',
      content: quoteMatch[1].trim(),
      attribution: quoteMatch[2].trim(),
    };
    remaining = remaining.slice(0, quoteMatch.index).trim();
  }
  
  // 2. Split remaining content into paragraphs
  const paragraphs = splitIntoReadableParagraphs(remaining);
  paragraphs.forEach(p => {
    sections.push({ type: 'paragraph', content: p });
  });
  
  // 3. Add quote at the end if found
  if (quoteSection !== null) {
    sections.push(quoteSection);
  }
  
  return sections;
}

/**
 * Component to render the formatted description
 */
export function FormattedDescription({ text, className }: FormattedDescriptionProps): React.ReactElement {
  const sections = parseDescription(text);

  return (
    <div className={cn('space-y-5', className)}>
      {sections.map((section, index) => {
        switch (section.type) {
          case 'quote':
            return (
              <blockquote 
                key={index}
                className="relative bg-gradient-to-r from-cyan-glow/5 via-purple-neon/5 to-pink-featured/5 border-l-4 border-cyan-glow rounded-r-xl p-5 mt-6"
              >
                <Quote className="absolute top-4 left-4 h-5 w-5 text-cyan-glow/30" />
                <p className="text-text-primary italic pl-7 text-sm leading-relaxed">
                  &ldquo;{section.content}&rdquo;
                </p>
                {section.attribution !== undefined && section.attribution !== '' && (
                  <footer className="mt-2 pl-7 text-xs text-text-muted">
                    — {section.attribution}
                  </footer>
                )}
              </blockquote>
            );
          
          case 'paragraph':
          default:
            return (
              <p 
                key={index}
                className="text-text-secondary leading-relaxed text-sm"
              >
                {section.content}
              </p>
            );
        }
      })}
    </div>
  );
}

export default FormattedDescription;
