# AdminCatalogKinguinApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminKinguinControllerImportProduct**](AdminCatalogKinguinApi.md#adminkinguincontrollerimportproduct) | **POST** /admin/catalog/kinguin/import/{productId} | Import Kinguin product |
| [**adminKinguinControllerSearchProducts**](AdminCatalogKinguinApi.md#adminkinguincontrollersearchproducts) | **GET** /admin/catalog/kinguin/search | Search Kinguin products |



## adminKinguinControllerImportProduct

> KinguinImportResponseDto adminKinguinControllerImportProduct(productId, businessCategory)

Import Kinguin product

Import a specific Kinguin product into the BitLoot catalog. Uses the Kinguin productId from search results.

### Example

```ts
import {
  Configuration,
  AdminCatalogKinguinApi,
} from '';
import type { AdminKinguinControllerImportProductRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogKinguinApi(config);

  const body = {
    // string | Kinguin product ID to import
    productId: 5c9b5b4b4f4c4c4c4c4c4c4c,
    // 'games' | 'software' | 'gift-cards' | 'subscriptions' | Business category for the imported product (optional)
    businessCategory: businessCategory_example,
  } satisfies AdminKinguinControllerImportProductRequest;

  try {
    const data = await api.adminKinguinControllerImportProduct(body);
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
| **productId** | `string` | Kinguin product ID to import | [Defaults to `undefined`] |
| **businessCategory** | `games`, `software`, `gift-cards`, `subscriptions` | Business category for the imported product | [Optional] [Defaults to `undefined`] [Enum: games, software, gift-cards, subscriptions] |

### Return type

[**KinguinImportResponseDto**](KinguinImportResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Product imported successfully |  -  |
| **401** | Unauthorized |  -  |
| **403** | Forbidden - Admin only |  -  |
| **404** | Product not found on Kinguin |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminKinguinControllerSearchProducts

> KinguinSearchResponseDto adminKinguinControllerSearchProducts(query, platform, genre, limit, page)

Search Kinguin products

Search the Kinguin catalog by product name. Returns matching products with their details. Use this to find products to import.

### Example

```ts
import {
  Configuration,
  AdminCatalogKinguinApi,
} from '';
import type { AdminKinguinControllerSearchProductsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogKinguinApi(config);

  const body = {
    // string | Product name to search for (minimum 3 characters)
    query: Cyberpunk 2077,
    // string | Filter by platform (optional)
    platform: Steam,
    // string | Filter by genre (optional)
    genre: RPG,
    // string | Maximum results (default: 20, max: 100) (optional)
    limit: 20,
    // string | Page number (default: 1) (optional)
    page: 1,
  } satisfies AdminKinguinControllerSearchProductsRequest;

  try {
    const data = await api.adminKinguinControllerSearchProducts(body);
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
| **query** | `string` | Product name to search for (minimum 3 characters) | [Defaults to `undefined`] |
| **platform** | `string` | Filter by platform | [Optional] [Defaults to `undefined`] |
| **genre** | `string` | Filter by genre | [Optional] [Defaults to `undefined`] |
| **limit** | `string` | Maximum results (default: 20, max: 100) | [Optional] [Defaults to `undefined`] |
| **page** | `string` | Page number (default: 1) | [Optional] [Defaults to `undefined`] |

### Return type

[**KinguinSearchResponseDto**](KinguinSearchResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Search results returned |  -  |
| **400** | Invalid query (min 3 characters) |  -  |
| **401** | Unauthorized |  -  |
| **403** | Forbidden - Admin only |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

