# CatalogApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**catalogControllerGetCategories**](CatalogApi.md#catalogcontrollergetcategories) | **GET** /catalog/categories | Get dynamic categories with counts |
| [**catalogControllerGetFeaturedProducts**](CatalogApi.md#catalogcontrollergetfeaturedproducts) | **GET** /catalog/products/featured | Get featured products |
| [**catalogControllerGetFilters**](CatalogApi.md#catalogcontrollergetfilters) | **GET** /catalog/filters | Get available filter options |
| [**catalogControllerGetProduct**](CatalogApi.md#catalogcontrollergetproduct) | **GET** /catalog/products/{slug} | Get single product by slug |
| [**catalogControllerGetProductsBySection**](CatalogApi.md#catalogcontrollergetproductsbysection) | **GET** /catalog/sections/{sectionKey} | Get products for a homepage section |
| [**catalogControllerListProducts**](CatalogApi.md#catalogcontrollerlistproducts) | **GET** /catalog/products | List products with filtering and pagination |



## catalogControllerGetCategories

> CategoriesResponseDto catalogControllerGetCategories()

Get dynamic categories with counts

Returns all available categories (genres, platforms, collections) dynamically aggregated from published products. Also includes featured/virtual categories for special sorts.

### Example

```ts
import {
  Configuration,
  CatalogApi,
} from '';
import type { CatalogControllerGetCategoriesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new CatalogApi();

  try {
    const data = await api.catalogControllerGetCategories();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**CategoriesResponseDto**](CategoriesResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Categories with product counts and featured collections |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## catalogControllerGetFeaturedProducts

> ProductListResponseDto catalogControllerGetFeaturedProducts(limit)

Get featured products

Returns products marked as featured (isFeatured&#x3D;true), sorted by featured order. Use for homepage featured section.

### Example

```ts
import {
  Configuration,
  CatalogApi,
} from '';
import type { CatalogControllerGetFeaturedProductsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new CatalogApi();

  const body = {
    // number | Max products to return (default 8, max 24) (optional)
    limit: 8.14,
  } satisfies CatalogControllerGetFeaturedProductsRequest;

  try {
    const data = await api.catalogControllerGetFeaturedProducts(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **limit** | `number` | Max products to return (default 8, max 24) | [Optional] [Defaults to `undefined`] |

### Return type

[**ProductListResponseDto**](ProductListResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Featured products list |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## catalogControllerGetFilters

> FiltersResponseDto catalogControllerGetFilters()

Get available filter options

Returns all available filter options (platforms, regions, genres) with counts, plus price range. Used for building dynamic filter UI.

### Example

```ts
import {
  Configuration,
  CatalogApi,
} from '';
import type { CatalogControllerGetFiltersRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new CatalogApi();

  try {
    const data = await api.catalogControllerGetFilters();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**FiltersResponseDto**](FiltersResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Filter options with counts and price range |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## catalogControllerGetProduct

> ProductResponseDto catalogControllerGetProduct(slug)

Get single product by slug

### Example

```ts
import {
  Configuration,
  CatalogApi,
} from '';
import type { CatalogControllerGetProductRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new CatalogApi();

  const body = {
    // string
    slug: slug_example,
  } satisfies CatalogControllerGetProductRequest;

  try {
    const data = await api.catalogControllerGetProduct(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **slug** | `string` |  | [Defaults to `undefined`] |

### Return type

[**ProductResponseDto**](ProductResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Product details |  -  |
| **404** | Product not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## catalogControllerGetProductsBySection

> ProductListResponseDto catalogControllerGetProductsBySection(sectionKey, limit)

Get products for a homepage section

Returns products assigned to a specific homepage section (trending, featured_games, etc.)

### Example

```ts
import {
  Configuration,
  CatalogApi,
} from '';
import type { CatalogControllerGetProductsBySectionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new CatalogApi();

  const body = {
    // string
    sectionKey: sectionKey_example,
    // number | Max products to return (default 12) (optional)
    limit: 8.14,
  } satisfies CatalogControllerGetProductsBySectionRequest;

  try {
    const data = await api.catalogControllerGetProductsBySection(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **sectionKey** | `string` |  | [Defaults to `undefined`] |
| **limit** | `number` | Max products to return (default 12) | [Optional] [Defaults to `undefined`] |

### Return type

[**ProductListResponseDto**](ProductListResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Products in section |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## catalogControllerListProducts

> ProductListResponseDto catalogControllerListProducts(q, platform, region, businessCategory, category, featured, sort, limit, offset)

List products with filtering and pagination

### Example

```ts
import {
  Configuration,
  CatalogApi,
} from '';
import type { CatalogControllerListProductsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new CatalogApi();

  const body = {
    // string | Search query (full-text) (optional)
    q: q_example,
    // string | Filter by platform (Steam, Epic, etc) (optional)
    platform: platform_example,
    // string | Filter by region (US, EU, etc) (optional)
    region: region_example,
    // string | Filter by BitLoot category: games, software, gift-cards, subscriptions (optional)
    businessCategory: businessCategory_example,
    // string | Filter by genre (legacy Kinguin genres) (optional)
    category: category_example,
    // boolean | Show only featured products (optional)
    featured: true,
    // 'newest' | 'price_asc' | 'price_desc' | 'rating' (optional)
    sort: sort_example,
    // number | Items per page (≤ 100) (optional)
    limit: 8.14,
    // number | Pagination offset (optional)
    offset: 8.14,
  } satisfies CatalogControllerListProductsRequest;

  try {
    const data = await api.catalogControllerListProducts(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **q** | `string` | Search query (full-text) | [Optional] [Defaults to `undefined`] |
| **platform** | `string` | Filter by platform (Steam, Epic, etc) | [Optional] [Defaults to `undefined`] |
| **region** | `string` | Filter by region (US, EU, etc) | [Optional] [Defaults to `undefined`] |
| **businessCategory** | `string` | Filter by BitLoot category: games, software, gift-cards, subscriptions | [Optional] [Defaults to `undefined`] |
| **category** | `string` | Filter by genre (legacy Kinguin genres) | [Optional] [Defaults to `undefined`] |
| **featured** | `boolean` | Show only featured products | [Optional] [Defaults to `undefined`] |
| **sort** | `newest`, `price_asc`, `price_desc`, `rating` |  | [Optional] [Defaults to `undefined`] [Enum: newest, price_asc, price_desc, rating] |
| **limit** | `number` | Items per page (≤ 100) | [Optional] [Defaults to `undefined`] |
| **offset** | `number` | Pagination offset | [Optional] [Defaults to `undefined`] |

### Return type

[**ProductListResponseDto**](ProductListResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Paginated product list |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

