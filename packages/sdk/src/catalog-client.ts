import type { ProductResponseDto, ProductListResponseDto } from './generated';
import { CatalogApi, Configuration } from './generated';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const config = new Configuration({
    basePath: API_BASE,
});

// Create singleton instance
const catalogApiInstance = new CatalogApi(config);

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
};

export type CatalogClient = typeof catalogClient;
