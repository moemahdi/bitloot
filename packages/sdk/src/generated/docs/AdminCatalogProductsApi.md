# AdminCatalogProductsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminProductsControllerCreate**](AdminCatalogProductsApi.md#adminproductscontrollercreate) | **POST** /admin/catalog/products | Create custom product |
| [**adminProductsControllerDelete**](AdminCatalogProductsApi.md#adminproductscontrollerdelete) | **DELETE** /admin/catalog/products/{id} | Delete product |
| [**adminProductsControllerGetById**](AdminCatalogProductsApi.md#adminproductscontrollergetbyid) | **GET** /admin/catalog/products/{id} | Get product by ID (admin) |
| [**adminProductsControllerListAll**](AdminCatalogProductsApi.md#adminproductscontrollerlistall) | **GET** /admin/catalog/products | List products with pagination (admin) |
| [**adminProductsControllerPublish**](AdminCatalogProductsApi.md#adminproductscontrollerpublish) | **PATCH** /admin/catalog/products/{id}/publish | Publish product (set isPublished&#x3D;true) |
| [**adminProductsControllerUnpublish**](AdminCatalogProductsApi.md#adminproductscontrollerunpublish) | **PATCH** /admin/catalog/products/{id}/unpublish | Unpublish product (set isPublished&#x3D;false) |
| [**adminProductsControllerUpdate**](AdminCatalogProductsApi.md#adminproductscontrollerupdate) | **PATCH** /admin/catalog/products/{id} | Update product details |



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


## adminProductsControllerListAll

> AdminProductsListResponseDto adminProductsControllerListAll(search, platform, region, published, source, page, limit)

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

