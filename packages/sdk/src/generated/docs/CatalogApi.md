# CatalogApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**catalogControllerGetProduct**](CatalogApi.md#catalogcontrollergetproduct) | **GET** /catalog/products/{slug} | Get single product by slug |
| [**catalogControllerListProducts**](CatalogApi.md#catalogcontrollerlistproducts) | **GET** /catalog/products | List products with filtering and pagination |



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


## catalogControllerListProducts

> ProductListResponseDto catalogControllerListProducts(q, platform, region, category, sort, limit, offset)

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
    // string | Filter by category (optional)
    category: category_example,
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
| **category** | `string` | Filter by category | [Optional] [Defaults to `undefined`] |
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

