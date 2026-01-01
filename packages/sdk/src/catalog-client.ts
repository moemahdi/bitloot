import type { ProductResponseDto, ProductListResponseDto } from './generated';
import { CatalogApi, Configuration } from './generated';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const config = new Configuration({
    basePath: API_BASE,
});

// Create singleton instance
const catalogApiInstance = new CatalogApi(config);

/**
 * Category item returned from dynamic aggregation
 */
export interface CategoryDto {
    id: string;
    label: string;
    type: 'genre' | 'platform' | 'collection' | 'custom';
    count: number;
    icon?: string;
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
     */
    async findAll(params?: {
        q?: string;
        platform?: string;
        region?: string;
        category?: string;
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

        const response = await catalogApiInstance.catalogControllerListProducts({
            q: params?.q ?? params?.search,
            platform: params?.platform,
            region: params?.region,
            category: params?.category,
            sort: params?.sort,
            limit: (params?.limit ?? 12),
            offset: offset,
        });

        return response;
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
};

export type CatalogClient = typeof catalogClient;
