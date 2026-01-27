# AdminCatalogProductsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminProductsControllerBulkDelete**](AdminCatalogProductsApi.md#adminproductscontrollerbulkdelete) | **POST** /admin/catalog/products/bulk-delete | Bulk delete products |
| [**adminProductsControllerBulkFeature**](AdminCatalogProductsApi.md#adminproductscontrollerbulkfeature) | **POST** /admin/catalog/products/bulk-feature | Bulk feature products (set isFeatured&#x3D;true) |
| [**adminProductsControllerBulkPublish**](AdminCatalogProductsApi.md#adminproductscontrollerbulkpublish) | **POST** /admin/catalog/products/bulk-publish | Bulk publish products (set isPublished&#x3D;true) |
| [**adminProductsControllerBulkReprice**](AdminCatalogProductsApi.md#adminproductscontrollerbulkreprice) | **POST** /admin/catalog/products/bulk-reprice | Bulk reprice products based on current pricing rules |
| [**adminProductsControllerBulkUnfeature**](AdminCatalogProductsApi.md#adminproductscontrollerbulkunfeature) | **POST** /admin/catalog/products/bulk-unfeature | Bulk unfeature products (set isFeatured&#x3D;false) |
| [**adminProductsControllerBulkUnpublish**](AdminCatalogProductsApi.md#adminproductscontrollerbulkunpublish) | **POST** /admin/catalog/products/bulk-unpublish | Bulk unpublish products (set isPublished&#x3D;false) |
| [**adminProductsControllerCreate**](AdminCatalogProductsApi.md#adminproductscontrollercreate) | **POST** /admin/catalog/products | Create custom product |
| [**adminProductsControllerDelete**](AdminCatalogProductsApi.md#adminproductscontrollerdelete) | **DELETE** /admin/catalog/products/{id} | Delete product |
| [**adminProductsControllerFeature**](AdminCatalogProductsApi.md#adminproductscontrollerfeature) | **PATCH** /admin/catalog/products/{id}/feature | Mark product as featured |
| [**adminProductsControllerGetById**](AdminCatalogProductsApi.md#adminproductscontrollergetbyid) | **GET** /admin/catalog/products/{id} | Get product by ID (admin) |
| [**adminProductsControllerGetGenres**](AdminCatalogProductsApi.md#adminproductscontrollergetgenres) | **GET** /admin/catalog/products/genres | Get all unique genres from products |
| [**adminProductsControllerListAll**](AdminCatalogProductsApi.md#adminproductscontrollerlistall) | **GET** /admin/catalog/products | List products with pagination (admin) |
| [**adminProductsControllerPublish**](AdminCatalogProductsApi.md#adminproductscontrollerpublish) | **PATCH** /admin/catalog/products/{id}/publish | Publish product (set isPublished&#x3D;true) |
| [**adminProductsControllerReprice**](AdminCatalogProductsApi.md#adminproductscontrollerreprice) | **PATCH** /admin/catalog/products/{id}/reprice | Reprice a single product based on current pricing rules |
| [**adminProductsControllerUnfeature**](AdminCatalogProductsApi.md#adminproductscontrollerunfeature) | **PATCH** /admin/catalog/products/{id}/unfeature | Remove product from featured |
| [**adminProductsControllerUnpublish**](AdminCatalogProductsApi.md#adminproductscontrollerunpublish) | **PATCH** /admin/catalog/products/{id}/unpublish | Unpublish product (set isPublished&#x3D;false) |
| [**adminProductsControllerUpdate**](AdminCatalogProductsApi.md#adminproductscontrollerupdate) | **PATCH** /admin/catalog/products/{id} | Update product details |



## adminProductsControllerBulkDelete

> BulkDeleteResponseDto adminProductsControllerBulkDelete(bulkDeleteProductsDto)

Bulk delete products

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerBulkDeleteRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  const body = {
    // BulkDeleteProductsDto
    bulkDeleteProductsDto: ...,
  } satisfies AdminProductsControllerBulkDeleteRequest;

  try {
    const data = await api.adminProductsControllerBulkDelete(body);
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
| **bulkDeleteProductsDto** | [BulkDeleteProductsDto](BulkDeleteProductsDto.md) |  | |

### Return type

[**BulkDeleteResponseDto**](BulkDeleteResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Products deleted |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminProductsControllerBulkFeature

> BulkPublishResponseDto adminProductsControllerBulkFeature(bulkPublishProductsDto)

Bulk feature products (set isFeatured&#x3D;true)

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerBulkFeatureRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  const body = {
    // BulkPublishProductsDto
    bulkPublishProductsDto: ...,
  } satisfies AdminProductsControllerBulkFeatureRequest;

  try {
    const data = await api.adminProductsControllerBulkFeature(body);
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
| **bulkPublishProductsDto** | [BulkPublishProductsDto](BulkPublishProductsDto.md) |  | |

### Return type

[**BulkPublishResponseDto**](BulkPublishResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Products featured |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminProductsControllerBulkPublish

> BulkPublishResponseDto adminProductsControllerBulkPublish(bulkPublishProductsDto)

Bulk publish products (set isPublished&#x3D;true)

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerBulkPublishRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  const body = {
    // BulkPublishProductsDto
    bulkPublishProductsDto: ...,
  } satisfies AdminProductsControllerBulkPublishRequest;

  try {
    const data = await api.adminProductsControllerBulkPublish(body);
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
| **bulkPublishProductsDto** | [BulkPublishProductsDto](BulkPublishProductsDto.md) |  | |

### Return type

[**BulkPublishResponseDto**](BulkPublishResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Products published |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminProductsControllerBulkReprice

> BulkRepriceResponseDto adminProductsControllerBulkReprice(bulkRepriceProductsDto)

Bulk reprice products based on current pricing rules

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerBulkRepriceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  const body = {
    // BulkRepriceProductsDto
    bulkRepriceProductsDto: ...,
  } satisfies AdminProductsControllerBulkRepriceRequest;

  try {
    const data = await api.adminProductsControllerBulkReprice(body);
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
| **bulkRepriceProductsDto** | [BulkRepriceProductsDto](BulkRepriceProductsDto.md) |  | |

### Return type

[**BulkRepriceResponseDto**](BulkRepriceResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Products repriced |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminProductsControllerBulkUnfeature

> BulkPublishResponseDto adminProductsControllerBulkUnfeature(bulkPublishProductsDto)

Bulk unfeature products (set isFeatured&#x3D;false)

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerBulkUnfeatureRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  const body = {
    // BulkPublishProductsDto
    bulkPublishProductsDto: ...,
  } satisfies AdminProductsControllerBulkUnfeatureRequest;

  try {
    const data = await api.adminProductsControllerBulkUnfeature(body);
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
| **bulkPublishProductsDto** | [BulkPublishProductsDto](BulkPublishProductsDto.md) |  | |

### Return type

[**BulkPublishResponseDto**](BulkPublishResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Products unfeatured |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminProductsControllerBulkUnpublish

> BulkUnpublishResponseDto adminProductsControllerBulkUnpublish(bulkUnpublishProductsDto)

Bulk unpublish products (set isPublished&#x3D;false)

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerBulkUnpublishRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  const body = {
    // BulkUnpublishProductsDto
    bulkUnpublishProductsDto: ...,
  } satisfies AdminProductsControllerBulkUnpublishRequest;

  try {
    const data = await api.adminProductsControllerBulkUnpublish(body);
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
| **bulkUnpublishProductsDto** | [BulkUnpublishProductsDto](BulkUnpublishProductsDto.md) |  | |

### Return type

[**BulkUnpublishResponseDto**](BulkUnpublishResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Products unpublished |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminProductsControllerCreate

> AdminProductResponseDto adminProductsControllerCreate(createProductDto)

Create custom product

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerCreateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  const body = {
    // CreateProductDto
    createProductDto: ...,
  } satisfies AdminProductsControllerCreateRequest;

  try {
    const data = await api.adminProductsControllerCreate(body);
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
| **createProductDto** | [CreateProductDto](CreateProductDto.md) |  | |

### Return type

[**AdminProductResponseDto**](AdminProductResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |
| **403** | Feature disabled |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminProductsControllerDelete

> adminProductsControllerDelete(id)

Delete product

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerDeleteRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminProductsControllerDeleteRequest;

  try {
    const data = await api.adminProductsControllerDelete(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Product deleted |  -  |
| **404** | Product not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminProductsControllerFeature

> AdminProductResponseDto adminProductsControllerFeature(id)

Mark product as featured

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerFeatureRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminProductsControllerFeatureRequest;

  try {
    const data = await api.adminProductsControllerFeature(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**AdminProductResponseDto**](AdminProductResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Product marked as featured |  -  |
| **404** | Product not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminProductsControllerGetById

> AdminProductResponseDto adminProductsControllerGetById(id)

Get product by ID (admin)

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerGetByIdRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminProductsControllerGetByIdRequest;

  try {
    const data = await api.adminProductsControllerGetById(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**AdminProductResponseDto**](AdminProductResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | Product not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminProductsControllerGetGenres

> Array&lt;string&gt; adminProductsControllerGetGenres()

Get all unique genres from products

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerGetGenresRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  try {
    const data = await api.adminProductsControllerGetGenres();
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

**Array<string>**

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of unique genre names |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminProductsControllerListAll

> AdminProductsListResponseDto adminProductsControllerListAll(search, platform, region, published, source, businessCategory, genre, featured, page, limit)

List products with pagination (admin)

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerListAllRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  const body = {
    // string | Search by title (optional)
    search: search_example,
    // string | Filter by platform (optional)
    platform: platform_example,
    // string | Filter by region (optional)
    region: region_example,
    // string | Filter by published status (true/false) (optional)
    published: published_example,
    // string | Filter by source (kinguin/custom) (optional)
    source: source_example,
    // string | Filter by business category (games/software/gift-cards/subscriptions) (optional)
    businessCategory: businessCategory_example,
    // string | Filter by genre (e.g., Action, RPG, Strategy) (optional)
    genre: genre_example,
    // string | Filter by featured status (true/false) (optional)
    featured: featured_example,
    // string | Page number (1-based) (optional)
    page: 1,
    // string | Items per page (max 100) (optional)
    limit: 25,
  } satisfies AdminProductsControllerListAllRequest;

  try {
    const data = await api.adminProductsControllerListAll(body);
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
| **search** | `string` | Search by title | [Optional] [Defaults to `undefined`] |
| **platform** | `string` | Filter by platform | [Optional] [Defaults to `undefined`] |
| **region** | `string` | Filter by region | [Optional] [Defaults to `undefined`] |
| **published** | `string` | Filter by published status (true/false) | [Optional] [Defaults to `undefined`] |
| **source** | `string` | Filter by source (kinguin/custom) | [Optional] [Defaults to `undefined`] |
| **businessCategory** | `string` | Filter by business category (games/software/gift-cards/subscriptions) | [Optional] [Defaults to `undefined`] |
| **genre** | `string` | Filter by genre (e.g., Action, RPG, Strategy) | [Optional] [Defaults to `undefined`] |
| **featured** | `string` | Filter by featured status (true/false) | [Optional] [Defaults to `undefined`] |
| **page** | `string` | Page number (1-based) | [Optional] [Defaults to `undefined`] |
| **limit** | `string` | Items per page (max 100) | [Optional] [Defaults to `undefined`] |

### Return type

[**AdminProductsListResponseDto**](AdminProductsListResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Paginated products list with total count |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminProductsControllerPublish

> AdminProductResponseDto adminProductsControllerPublish(id)

Publish product (set isPublished&#x3D;true)

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerPublishRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminProductsControllerPublishRequest;

  try {
    const data = await api.adminProductsControllerPublish(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**AdminProductResponseDto**](AdminProductResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | Product not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminProductsControllerReprice

> AdminProductResponseDto adminProductsControllerReprice(id)

Reprice a single product based on current pricing rules

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerRepriceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminProductsControllerRepriceRequest;

  try {
    const data = await api.adminProductsControllerReprice(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**AdminProductResponseDto**](AdminProductResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | Product not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminProductsControllerUnfeature

> AdminProductResponseDto adminProductsControllerUnfeature(id)

Remove product from featured

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerUnfeatureRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminProductsControllerUnfeatureRequest;

  try {
    const data = await api.adminProductsControllerUnfeature(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**AdminProductResponseDto**](AdminProductResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Product removed from featured |  -  |
| **404** | Product not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminProductsControllerUnpublish

> AdminProductResponseDto adminProductsControllerUnpublish(id)

Unpublish product (set isPublished&#x3D;false)

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerUnpublishRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminProductsControllerUnpublishRequest;

  try {
    const data = await api.adminProductsControllerUnpublish(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**AdminProductResponseDto**](AdminProductResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | Product not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminProductsControllerUpdate

> AdminProductResponseDto adminProductsControllerUpdate(id, updateProductDto)

Update product details

### Example

```ts
import {
  Configuration,
  AdminCatalogProductsApi,
} from '';
import type { AdminProductsControllerUpdateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogProductsApi(config);

  const body = {
    // string
    id: id_example,
    // UpdateProductDto
    updateProductDto: ...,
  } satisfies AdminProductsControllerUpdateRequest;

  try {
    const data = await api.adminProductsControllerUpdate(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |
| **updateProductDto** | [UpdateProductDto](UpdateProductDto.md) |  | |

### Return type

[**AdminProductResponseDto**](AdminProductResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | Product not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

