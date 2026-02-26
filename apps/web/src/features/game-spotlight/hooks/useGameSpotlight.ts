'use client';

/**
 * useGameSpotlight Hook
 *
 * TanStack Query hook for fetching spotlight game data.
 * Fetches a single spotlight by slug with all its products.
 */

import { useQuery } from '@tanstack/react-query';
import { CatalogGroupsApi, Configuration } from '@bitloot/sdk';

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});

const groupsApi = new CatalogGroupsApi(apiConfig);

/**
 * Fetch a single spotlight game by slug
 */
export function useGameSpotlight(slug: string) {
  return useQuery({
    queryKey: ['spotlight', slug],
    queryFn: async () => {
      const response = await groupsApi.groupsControllerGetSpotlight({ slug });
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: slug !== '' && slug !== undefined,
  });
}

/**
 * Fetch all active spotlights for homepage/carousel
 */
export function useSpotlights() {
  return useQuery({
    queryKey: ['spotlights'],
    queryFn: async () => {
      const response = await groupsApi.groupsControllerListSpotlights();
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
