/**
 * Loading state for game spotlight pages
 *
 * Displays a cinematic skeleton while the page loads.
 */

export default function GameSpotlightLoading(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-bg-primary">
      {/* Hero Skeleton */}
      <section className="relative min-h-[70vh] overflow-hidden">
        <div className="absolute inset-0 skeleton" />
        <div className="absolute inset-0 bg-linear-to-t from-bg-primary via-bg-primary/80 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 lg:py-32">
          <div className="max-w-3xl space-y-6">
            {/* Badge */}
            <div className="skeleton h-8 w-32 rounded-full" />

            {/* Title */}
            <div className="skeleton h-14 w-3/4 rounded-lg" />

            {/* Tagline */}
            <div className="skeleton h-6 w-1/2 rounded" />

            {/* Meta row */}
            <div className="flex gap-4">
              <div className="skeleton h-8 w-24 rounded" />
              <div className="skeleton h-8 w-32 rounded" />
              <div className="skeleton h-8 w-28 rounded" />
            </div>

            {/* Price */}
            <div className="skeleton h-10 w-40 rounded" />

            {/* CTAs */}
            <div className="flex gap-4">
              <div className="skeleton h-12 w-36 rounded-lg" />
              <div className="skeleton h-12 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Content Skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Platform tabs */}
        <div className="mb-8 flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-10 w-24 rounded-lg" />
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="skeleton aspect-4/5 rounded-xl" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
