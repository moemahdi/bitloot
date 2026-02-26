/**
 * useInView — Intersection Observer hook for deferred loading.
 *
 * Returns a ref to attach to a DOM element and a boolean `inView` that
 * becomes `true` (and stays true permanently) once the element enters the
 * viewport expanded by `rootMargin`.  Once `inView` is true the observer
 * disconnects, so there is zero ongoing overhead.
 *
 * Primary use-case: gate TanStack Query `enabled` flag so below-fold sections
 * never fire network requests until the user is about to scroll to them.
 *
 * Usage:
 *   const { ref, inView } = useInView('400px');
 *   const { data } = useQuery({ ..., enabled: inView });
 *   return <section ref={ref as Ref<HTMLElement>}>...</section>
 */

import { useEffect, useRef, useState } from 'react';

export function useInView(rootMargin = '400px 0px'): {
  ref: React.RefObject<HTMLDivElement | null>;
  inView: boolean;
} {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el === null || inView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting === true) {
          setInView(true);
          observer.disconnect(); // once triggered, never fires again
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, inView]);

  return { ref, inView };
}
