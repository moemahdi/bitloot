'use client';

import { useState, useMemo } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/design-system/primitives/button';
import { cn } from '@/design-system/utils/utils';

export interface WebhookPayloadViewerProps {
  payload: Record<string, unknown> | string | null | undefined;
  maxHeight?: number;
  title?: string;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

/**
 * JSON Payload Viewer - BitLoot neon cyberpunk style
 * Terminal-style JSON viewer with neon syntax highlighting
 * Features: Copy button with success glow, expand/collapse, height toggle
 * 
 * @example
 * <WebhookPayloadViewer payload={webhookData} title="IPN Payload" />
 * <WebhookPayloadViewer payload={orderData} collapsible={false} />
 */
export function WebhookPayloadViewer({
  payload,
  maxHeight = 300,
  title = 'Payload',
  className,
  collapsible = true,
  defaultExpanded = true,
}: WebhookPayloadViewerProps): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [fullHeight, setFullHeight] = useState(false);

  const formattedJson = useMemo(() => {
    if (payload === null || payload === undefined) return null;
    try {
      const obj = typeof payload === 'string' ? (JSON.parse(payload) as unknown) : payload;
      return JSON.stringify(obj, null, 2);
    } catch {
      return typeof payload === 'string' ? payload : JSON.stringify(payload);
    }
  }, [payload]);

  const handleCopy = async () => {
    if (formattedJson === null) return;
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (payload === null || payload === undefined) {
    return (
      <div
        className={cn(
          'rounded-lg border border-border-subtle bg-bg-secondary p-4',
          className,
        )}
      >
        <p className="text-sm text-text-muted italic">No payload data available</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border-subtle bg-bg-secondary overflow-hidden transition-all duration-200',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-bg-tertiary">
        <button
          onClick={() => collapsible && setExpanded(!expanded)}
          className={cn(
            'inline-flex items-center gap-2 font-medium text-sm text-text-primary transition-colors duration-200',
            collapsible && 'hover:text-cyan-glow cursor-pointer',
            !collapsible && 'cursor-default',
          )}
          disabled={!collapsible}
          aria-expanded={expanded}
          aria-label={collapsible ? `${expanded ? 'Collapse' : 'Expand'} ${title}` : title}
        >
          {collapsible && (
            expanded ? (
              <ChevronUp className="h-4 w-4 text-cyan-glow transition-transform duration-200" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-secondary transition-transform duration-200" />
            )
          )}
          {title}
        </button>
        <div className="flex items-center gap-2">
          {expanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFullHeight(!fullHeight)}
              className={cn(
                'h-8 px-2 text-text-secondary hover:text-purple-neon transition-colors duration-200',
              )}
              aria-label={fullHeight ? 'Minimize height' : 'Maximize height'}
            >
              {fullHeight ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={cn(
              'h-8 px-2 transition-all duration-200',
              copied
                ? 'text-green-success shadow-glow-success'
                : 'text-text-secondary hover:text-cyan-glow hover:shadow-glow-cyan-sm',
            )}
            aria-label={copied ? 'Copied to clipboard' : 'Copy payload to clipboard'}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="ml-1.5 text-xs font-medium">
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div
          className="overflow-auto bg-bg-primary scrollbar-thin"
          style={{ maxHeight: fullHeight ? 'none' : maxHeight }}
        >
          <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap break-words text-text-primary">
            <JsonHighlight json={formattedJson ?? ''} />
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Neon Syntax Highlighter - BitLoot terminal style
 * Semantic color mapping:
 * - Keys: cyan-glow (primary brand color)
 * - Strings: green-success (positive feedback)
 * - Numbers: orange-warning (attention grabbing)
 * - Booleans: purple-neon (secondary accent)
 * - Null: text-muted (subtle/undefined)
 */
function JsonHighlight({ json }: { json: string }): React.ReactElement {
  // Apply BitLoot neon syntax highlighting
  const highlighted = json
    .replace(/"([^"]+)":/g, '<span class="text-cyan-glow">"$1"</span>:') // keys → cyan
    .replace(/: "(.*?)"/g, ': <span class="text-green-success">"$1"</span>') // strings → green
    .replace(/: (\d+\.?\d*)/g, ': <span class="text-orange-warning">$1</span>') // numbers → orange
    .replace(/: (true|false)/g, ': <span class="text-purple-neon">$1</span>') // booleans → purple
    .replace(/: (null)/g, ': <span class="text-text-muted">$1</span>'); // null → muted

  return <code dangerouslySetInnerHTML={{ __html: highlighted }} />;
}

/**
 * Compact Inline Payload Preview - BitLoot neon style
 * Truncated JSON preview with terminal aesthetic
 * 
 * @example
 * <PayloadPreview payload={webhookData} maxLength={80} />
 */
export function PayloadPreview({
  payload,
  maxLength = 100,
  className,
}: {
  payload: Record<string, unknown> | string | null | undefined;
  maxLength?: number;
  className?: string;
}): React.ReactElement {
  const preview = useMemo(() => {
    if (payload === null || payload === undefined) return 'No payload';
    try {
      const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
      return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
    } catch {
      return 'Invalid payload';
    }
  }, [payload, maxLength]);

  return (
    <code
      className={cn(
        'text-xs text-cyan-glow bg-bg-tertiary px-2 py-1 rounded font-mono truncate border border-border-subtle',
        className,
      )}
    >
      {preview}
    </code>
  );
}
