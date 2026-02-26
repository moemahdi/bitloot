'use client';

/**
 * VideoModal Component
 *
 * Full-screen modal for playing trailer videos.
 * Supports YouTube and Vimeo embeds.
 */

import { useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/design-system/primitives/button';

interface VideoModalProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Extracts YouTube embed URL from various YouTube URL formats
 */
function getYouTubeEmbedUrl(url: string): string | null {
  // Already an embed URL
  if (url.includes('youtube.com/embed/')) {
    return url;
  }

  // Standard watch URL
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (watchMatch !== null) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&rel=0`;
  }

  return null;
}

/**
 * Extracts Vimeo embed URL from various Vimeo URL formats
 */
function getVimeoEmbedUrl(url: string): string | null {
  // Already an embed URL
  if (url.includes('player.vimeo.com/video/')) {
    return url;
  }

  // Standard Vimeo URL
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch !== null) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  return null;
}

function getEmbedUrl(url: string): string {
  const youtubeUrl = getYouTubeEmbedUrl(url);
  if (youtubeUrl !== null) return youtubeUrl;

  const vimeoUrl = getVimeoEmbedUrl(url);
  if (vimeoUrl !== null) return vimeoUrl;

  // Return as-is if not recognized
  return url;
}

export function VideoModal({ videoUrl, isOpen, onClose }: VideoModalProps): React.JSX.Element | null {
  const embedUrl = useMemo(() => getEmbedUrl(videoUrl), [videoUrl]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-bg-secondary/50 hover:bg-bg-secondary"
            aria-label="Close video"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Video container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl aspect-video rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={embedUrl}
              title="Video player"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
