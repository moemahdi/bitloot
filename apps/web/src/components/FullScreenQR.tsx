'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Download, Scan } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface FullScreenQRProps {
  /** QR code data (crypto payment URI) */
  qrData: string;
  /** Cryptocurrency being paid */
  currency: string;
  /** Payment amount */
  amount: number;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * Full-screen QR code modal for easier scanning
 * Optimized for mobile users scanning with wallet apps
 */
export function FullScreenQR({
  qrData,
  currency,
  amount,
  isOpen,
  onClose,
}: FullScreenQRProps): React.ReactElement {
  const handleDownload = (): void => {
    const svg = document.querySelector('.fullscreen-qr-svg');
    if (svg === null || svg === undefined) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bitloot-payment-${currency.toLowerCase()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-primary/95 backdrop-blur-xl"
          onClick={onClose}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-3 rounded-full bg-bg-tertiary hover:bg-border-subtle transition-colors text-text-muted hover:text-text-primary z-10"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex flex-col items-center gap-6 p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-glow/10 border border-cyan-glow/30 mb-4">
                <Scan className="h-4 w-4 text-cyan-glow" />
                <span className="text-sm font-medium text-cyan-glow">Scan to Pay</span>
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-1">
                {amount.toFixed(8)} {currency.toUpperCase()}
              </h2>
              <p className="text-text-muted text-sm">Open your wallet app and scan this QR code</p>
            </div>

            {/* Large QR Code */}
            <motion.div
              className="relative"
              animate={{ 
                boxShadow: ['0 0 30px rgba(0, 255, 255, 0.2)', '0 0 60px rgba(0, 255, 255, 0.3)', '0 0 30px rgba(0, 255, 255, 0.2)']
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="p-6 bg-white rounded-3xl shadow-2xl">
                <QRCodeSVG
                  value={qrData}
                  size={280}
                  level="H"
                  includeMargin={true}
                  className="fullscreen-qr-svg"
                />
              </div>
            </motion.div>

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-bg-tertiary hover:bg-border-subtle transition-colors text-text-secondary hover:text-text-primary border border-border-subtle"
            >
              <Download className="h-4 w-4" />
              Download QR Code
            </button>

            {/* Tip */}
            <p className="text-xs text-text-muted max-w-xs text-center">
              Tip: Make sure to send the <strong>exact amount</strong> shown above to avoid payment issues
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Button to open the full-screen QR modal
 */
export function ExpandQRButton({
  onClick,
  className = '',
}: {
  onClick: () => void;
  className?: string;
}): React.ReactElement {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-tertiary hover:bg-cyan-glow/10 hover:text-cyan-glow transition-all text-xs font-medium text-text-muted border border-border-subtle hover:border-cyan-glow/30 ${className}`}
    >
      <ZoomIn className="h-3.5 w-3.5" />
      Expand QR
    </motion.button>
  );
}
