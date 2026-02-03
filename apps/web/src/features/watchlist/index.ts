// Watchlist feature exports
export { WatchlistButton } from './components/WatchlistButton';
export { WatchlistProductCard } from './components/WatchlistProductCard';
export { WatchlistTabContent } from './components/WatchlistTabContent';
export type { WatchlistProduct } from './components/WatchlistProductCard';
export {
  useWatchlist,
  useWatchlistCount,
  useCheckWatchlist,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useToggleWatchlist,
  watchlistKeys,
} from './hooks/useWatchlist';
