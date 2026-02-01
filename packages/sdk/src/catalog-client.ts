import type { ProductResponseDto, ProductListResponseDto, ProductGroupResponseDto } from './generated';
import { CatalogApi, Configuration } from './generated';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const config = new Configuration({
    basePath: API_BASE,
});

// Create singleton instance
const catalogApiInstance = new CatalogApi(config);

/**
 * BitLoot Business Category - The 3 main store sections
 */
export type BusinessCategory = 'games' | 'software' | 'subscriptions';

/**
 * Category item returned from dynamic aggregation
 * Updated to use 'business' type for the 4 main BitLoot categories
 */
export interface CategoryDto {
    id: string;
    label: string;
    type: 'business' | 'genre' | 'platform' | 'collection' | 'custom';
    count: number;
    icon?: string;
    description?: string;
    sortOrder: number;
}

/**
 * Featured category (virtual categories like trending, new, etc.)
 */
export interface FeaturedCategoryDto {
    id: string;
    label: string;
    sort: string; // 'trending' | 'sales' | 'newest' | 'discount' | 'price_asc' | 'price_desc' | 'rating'
    icon?: string;
}

/**
 * Categories response with aggregated categories and featured collections
 */
export interface CategoriesResponseDto {
    categories: CategoryDto[];
    featured: FeaturedCategoryDto[];
    totalProducts: number;
}

/**
 * Platform filter option
 */
export interface PlatformFilterDto {
    id: string;
    label: string;
    count: number;
}

/**
 * Region filter option
 */
export interface RegionFilterDto {
    id: string;
    label: string;
    count: number;
}

/**
 * Genre filter option
 */
export interface GenreFilterDto {
    id: string;
    label: string;
    count: number;
}

/**
 * Price range information
 */
export interface PriceRangeDto {
    min: number;
    max: number;
    currency: string;
}

/**
 * Filters response with all filter options and price range
 */
export interface FiltersResponseDto {
    platforms: PlatformFilterDto[];
    regions: RegionFilterDto[];
    genres: GenreFilterDto[];
    priceRange: PriceRangeDto;
}

/**
 * Catalog Client Wrapper
 * Provides a simplified interface to the generated CatalogApi
 */
export const catalogClient = {
    /**
     * Get all products with optional filtering
     * Supports both businessCategory (4 main store sections) and category (legacy genres)
     */
    async findAll(params?: {
        q?: string;
        platform?: string;
        region?: string;
        businessCategory?: string; // 'games' | 'software' | 'subscriptions'
        category?: string; // Legacy genre filter
        sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating';
        limit?: number;
        offset?: number;
        page?: number;
        minPrice?: number;
        maxPrice?: number;
        search?: string;
        featured?: boolean;
    }): Promise<ProductListResponseDto> {
        // Convert page to offset if provided
        const offset = params?.page != null ? (params.page - 1) * (params?.limit ?? 12) : (params?.offset ?? 0);

        // Build query params manually since generated API may not have businessCategory yet
        const queryParams = new URLSearchParams();
        if (params?.q ?? params?.search) queryParams.set('q', params?.q ?? params?.search ?? '');
        if (params?.platform) queryParams.set('platform', params.platform);
        if (params?.region) queryParams.set('region', params.region);
        if (params?.businessCategory) queryParams.set('businessCategory', params.businessCategory);
        if (params?.category) queryParams.set('category', params.category);
        if (params?.featured) queryParams.set('featured', 'true');
        if (params?.minPrice != null && params.minPrice > 0) queryParams.set('minPrice', String(params.minPrice));
        if (params?.maxPrice != null && params.maxPrice < 500) queryParams.set('maxPrice', String(params.maxPrice));
        if (params?.sort) queryParams.set('sort', params.sort);
        queryParams.set('limit', String(params?.limit ?? 12));
        queryParams.set('offset', String(offset));

        const response = await fetch(`${API_BASE}/catalog/products?${queryParams.toString()}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status}`);
        }
        return response.json() as Promise<ProductListResponseDto>;
    },

    /**
     * Get a single product by ID or slug
     */
    async findOne(slugOrId: string): Promise<ProductResponseDto> {
        const response = await catalogApiInstance.catalogControllerGetProduct({
            slug: slugOrId,
        });

        return response;
    },

    /**
     * Get dynamic categories with product counts
     * Returns categories aggregated from published products plus featured collections
     */
    async getCategories(): Promise<CategoriesResponseDto> {
        const response = await fetch(`${API_BASE}/catalog/categories`);
        if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        return response.json() as Promise<CategoriesResponseDto>;
    },

    /**
     * Get available filter options with counts
     * Returns platforms, regions, genres with counts plus price range
     */
    async getFilters(): Promise<FiltersResponseDto> {
        const response = await fetch(`${API_BASE}/catalog/filters`);
        if (!response.ok) {
            throw new Error(`Failed to fetch filters: ${response.status}`);
        }
        return response.json() as Promise<FiltersResponseDto>;
    },

    /**
     * Get all active product groups for the catalog
     * Returns groups with their product count and price ranges
     */
    async getGroups(): Promise<ProductGroupResponseDto[]> {
        const response = await fetch(`${API_BASE}/catalog/groups`);
        if (!response.ok) {
            throw new Error(`Failed to fetch product groups: ${response.status}`);
        }
        return response.json() as Promise<ProductGroupResponseDto[]>;
    },
};

export type CatalogClient = typeof catalogClient;
