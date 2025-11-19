# AdminCatalogProductsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminProductsControllerCreate**](AdminCatalogProductsApi.md#adminproductscontrollercreate) | **POST** /admin/catalog/products | Create custom product |
| [**adminProductsControllerDelete**](AdminCatalogProductsApi.md#adminproductscontrollerdelete) | **DELETE** /admin/catalog/products/{id} | Delete product |
| [**adminProductsControllerGetById**](AdminCatalogProductsApi.md#adminproductscontrollergetbyid) | **GET** /admin/catalog/products/{id} | Get product by ID (admin) |
| [**adminProductsControllerListAll**](AdminCatalogProductsApi.md#adminproductscontrollerlistall) | **GET** /admin/catalog/products | List all products (admin - no pagination limit) |
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

> Array&lt;AdminProductResponseDto&gt; adminProductsControllerListAll(search, platform, region, published)

List all products (admin - no pagination limit)

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
    // string
    search: search_example,
    // string
    platform: platform_example,
    // string
    region: region_example,
    // string
    published: published_example,
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
| **search** | `string` |  | [Defaults to `undefined`] |
| **platform** | `string` |  | [Defaults to `undefined`] |
| **region** | `string` |  | [Defaults to `undefined`] |
| **published** | `string` |  | [Defaults to `undefined`] |

### Return type

[**Array&lt;AdminProductResponseDto&gt;**](AdminProductResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | All products regardless of publish status |  -  |

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

