/**
 * Game Spotlight Feature
 *
 * Complete feature for displaying game spotlight pages with:
 * - Cinematic hero sections with trailer embeds
 * - Platform filtering
 * - Edition/variant selection
 * - Feature highlights
 * - FAQ sections
 * - Countdown timers for upcoming games
 *
 * All styled with BitLoot's neon cyberpunk design system.
 */

// Components
export {
  SpotlightHero,
  CountdownTimer,
  VideoModal,
  PlatformGrid,
  EditionSelector,
  FeatureHighlights,
  FaqSection,
} from './components';

// Hooks
export { useGameSpotlight, useSpotlights } from './hooks/useGameSpotlight';

// Types
export type {
  SpotlightGroup,
  SpotlightProduct,
  FaqItem,
  SpotlightHeroProps,
  EditionSelectorProps,
  PlatformGridProps,
  PlatformTab,
  CountdownTimerProps,
  FeatureHighlightsProps,
  FaqSectionProps,
  VideoModalProps,
} from './types';
