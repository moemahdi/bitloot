# AdminProductGroupsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminGroupsControllerAssignProducts**](AdminProductGroupsApi.md#admingroupscontrollerassignproducts) | **POST** /admin/catalog/groups/{id}/products | Assign products to a group |
| [**adminGroupsControllerCreate**](AdminProductGroupsApi.md#admingroupscontrollercreate) | **POST** /admin/catalog/groups | Create a new product group |
| [**adminGroupsControllerDelete**](AdminProductGroupsApi.md#admingroupscontrollerdelete) | **DELETE** /admin/catalog/groups/{id} | Delete a product group |
| [**adminGroupsControllerFindById**](AdminProductGroupsApi.md#admingroupscontrollerfindbyid) | **GET** /admin/catalog/groups/{id} | Get product group by ID |
| [**adminGroupsControllerGetGroupProducts**](AdminProductGroupsApi.md#admingroupscontrollergetgroupproducts) | **GET** /admin/catalog/groups/{id}/products | Get all products in a group |
| [**adminGroupsControllerGetUnassignedProducts**](AdminProductGroupsApi.md#admingroupscontrollergetunassignedproducts) | **GET** /admin/catalog/groups/products/unassigned | Get all unassigned products |
| [**adminGroupsControllerList**](AdminProductGroupsApi.md#admingroupscontrollerlist) | **GET** /admin/catalog/groups | List all product groups |
| [**adminGroupsControllerRefreshAllStats**](AdminProductGroupsApi.md#admingroupscontrollerrefreshallstats) | **POST** /admin/catalog/groups/refresh-all-stats | Refresh all group statistics |
| [**adminGroupsControllerRefreshStats**](AdminProductGroupsApi.md#admingroupscontrollerrefreshstats) | **POST** /admin/catalog/groups/{id}/refresh-stats | Refresh group statistics |
| [**adminGroupsControllerRemoveProducts**](AdminProductGroupsApi.md#admingroupscontrollerremoveproducts) | **DELETE** /admin/catalog/groups/{id}/products | Remove products from a group |
| [**adminGroupsControllerUpdate**](AdminProductGroupsApi.md#admingroupscontrollerupdate) | **PATCH** /admin/catalog/groups/{id} | Update a product group |



## adminGroupsControllerAssignProducts

> ProductGroupWithProductsDto adminGroupsControllerAssignProducts(id, assignProductsToGroupDto)

Assign products to a group

Adds one or more products to this group. Products will be removed from any previous group.

### Example

```ts
import {
  Configuration,
  AdminProductGroupsApi,
} from '';
import type { AdminGroupsControllerAssignProductsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminProductGroupsApi(config);

  const body = {
    // string | Group UUID
    id: id_example,
    // AssignProductsToGroupDto
    assignProductsToGroupDto: ...,
  } satisfies AdminGroupsControllerAssignProductsRequest;

  try {
    const data = await api.adminGroupsControllerAssignProducts(body);
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
| **id** | `string` | Group UUID | [Defaults to `undefined`] |
| **assignProductsToGroupDto** | [AssignProductsToGroupDto](AssignProductsToGroupDto.md) |  | |

### Return type

[**ProductGroupWithProductsDto**](ProductGroupWithProductsDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Updated group with all products |  -  |
| **400** | One or more product IDs not found |  -  |
| **404** | Group not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminGroupsControllerCreate

> ProductGroupResponseDto adminGroupsControllerCreate(createProductGroupDto)

Create a new product group

Creates a new product group for consolidating multiple product variants.

### Example

```ts
import {
  Configuration,
  AdminProductGroupsApi,
} from '';
import type { AdminGroupsControllerCreateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminProductGroupsApi(config);

  const body = {
    // CreateProductGroupDto
    createProductGroupDto: ...,
  } satisfies AdminGroupsControllerCreateRequest;

  try {
    const data = await api.adminGroupsControllerCreate(body);
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
| **createProductGroupDto** | [CreateProductGroupDto](CreateProductGroupDto.md) |  | |

### Return type

[**ProductGroupResponseDto**](ProductGroupResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Product group created successfully |  -  |
| **400** | Invalid input |  -  |
| **409** | Group with this slug already exists |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminGroupsControllerDelete

> adminGroupsControllerDelete(id)

Delete a product group

Deletes a product group. Products in the group will become ungrouped.

### Example

```ts
import {
  Configuration,
  AdminProductGroupsApi,
} from '';
import type { AdminGroupsControllerDeleteRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminProductGroupsApi(config);

  const body = {
    // string | Group UUID
    id: id_example,
  } satisfies AdminGroupsControllerDeleteRequest;

  try {
    const data = await api.adminGroupsControllerDelete(body);
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
| **id** | `string` | Group UUID | [Defaults to `undefined`] |

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
| **204** | Group deleted successfully |  -  |
| **404** | Group not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminGroupsControllerFindById

> ProductGroupWithProductsDto adminGroupsControllerFindById(id)

Get product group by ID

Returns a single product group with all its products.

### Example

```ts
import {
  Configuration,
  AdminProductGroupsApi,
} from '';
import type { AdminGroupsControllerFindByIdRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminProductGroupsApi(config);

  const body = {
    // string | Group UUID
    id: id_example,
  } satisfies AdminGroupsControllerFindByIdRequest;

  try {
    const data = await api.adminGroupsControllerFindById(body);
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
| **id** | `string` | Group UUID | [Defaults to `undefined`] |

### Return type

[**ProductGroupWithProductsDto**](ProductGroupWithProductsDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Product group with products |  -  |
| **404** | Group not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminGroupsControllerGetGroupProducts

> Array&lt;GroupProductVariantDto&gt; adminGroupsControllerGetGroupProducts(id)

Get all products in a group

Returns all products assigned to this group.

### Example

```ts
import {
  Configuration,
  AdminProductGroupsApi,
} from '';
import type { AdminGroupsControllerGetGroupProductsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminProductGroupsApi(config);

  const body = {
    // string | Group UUID
    id: id_example,
  } satisfies AdminGroupsControllerGetGroupProductsRequest;

  try {
    const data = await api.adminGroupsControllerGetGroupProducts(body);
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
| **id** | `string` | Group UUID | [Defaults to `undefined`] |

### Return type

[**Array&lt;GroupProductVariantDto&gt;**](GroupProductVariantDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of products in the group |  -  |
| **404** | Group not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminGroupsControllerGetUnassignedProducts

> Array&lt;GroupProductVariantDto&gt; adminGroupsControllerGetUnassignedProducts()

Get all unassigned products

Returns all products that are not assigned to any group. Useful for product assignment UI.

### Example

```ts
import {
  Configuration,
  AdminProductGroupsApi,
} from '';
import type { AdminGroupsControllerGetUnassignedProductsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminProductGroupsApi(config);

  try {
    const data = await api.adminGroupsControllerGetUnassignedProducts();
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

[**Array&lt;GroupProductVariantDto&gt;**](GroupProductVariantDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of unassigned products |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminGroupsControllerList

> ProductGroupListResponseDto adminGroupsControllerList(isActive, search, page, limit)

List all product groups

Returns paginated list of product groups with optional filters.

### Example

```ts
import {
  Configuration,
  AdminProductGroupsApi,
} from '';
import type { AdminGroupsControllerListRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminProductGroupsApi(config);

  const body = {
    // boolean | Filter by active status (optional)
    isActive: true,
    // string | Search in title (optional)
    search: search_example,
    // number | Page number (1-based) (optional)
    page: 8.14,
    // number | Items per page (optional)
    limit: 8.14,
  } satisfies AdminGroupsControllerListRequest;

  try {
    const data = await api.adminGroupsControllerList(body);
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
| **isActive** | `boolean` | Filter by active status | [Optional] [Defaults to `undefined`] |
| **search** | `string` | Search in title | [Optional] [Defaults to `undefined`] |
| **page** | `number` | Page number (1-based) | [Optional] [Defaults to `1`] |
| **limit** | `number` | Items per page | [Optional] [Defaults to `20`] |

### Return type

[**ProductGroupListResponseDto**](ProductGroupListResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Paginated list of product groups |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminGroupsControllerRefreshAllStats

> adminGroupsControllerRefreshAllStats()

Refresh all group statistics

Recalculates min/max price and product count for all groups. Use after bulk price changes.

### Example

```ts
import {
  Configuration,
  AdminProductGroupsApi,
} from '';
import type { AdminGroupsControllerRefreshAllStatsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminProductGroupsApi(config);

  try {
    const data = await api.adminGroupsControllerRefreshAllStats();
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

`void` (Empty response body)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | All stats refreshed successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminGroupsControllerRefreshStats

> adminGroupsControllerRefreshStats(id)

Refresh group statistics

Recalculates min/max price and product count for a group.

### Example

```ts
import {
  Configuration,
  AdminProductGroupsApi,
} from '';
import type { AdminGroupsControllerRefreshStatsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminProductGroupsApi(config);

  const body = {
    // string | Group UUID
    id: id_example,
  } satisfies AdminGroupsControllerRefreshStatsRequest;

  try {
    const data = await api.adminGroupsControllerRefreshStats(body);
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
| **id** | `string` | Group UUID | [Defaults to `undefined`] |

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
| **200** | Stats refreshed successfully |  -  |
| **404** | Group not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminGroupsControllerRemoveProducts

> ProductGroupWithProductsDto adminGroupsControllerRemoveProducts(id, removeProductsFromGroupDto)

Remove products from a group

Removes one or more products from this group. Products become ungrouped.

### Example

```ts
import {
  Configuration,
  AdminProductGroupsApi,
} from '';
import type { AdminGroupsControllerRemoveProductsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminProductGroupsApi(config);

  const body = {
    // string | Group UUID
    id: id_example,
    // RemoveProductsFromGroupDto
    removeProductsFromGroupDto: ...,
  } satisfies AdminGroupsControllerRemoveProductsRequest;

  try {
    const data = await api.adminGroupsControllerRemoveProducts(body);
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
| **id** | `string` | Group UUID | [Defaults to `undefined`] |
| **removeProductsFromGroupDto** | [RemoveProductsFromGroupDto](RemoveProductsFromGroupDto.md) |  | |

### Return type

[**ProductGroupWithProductsDto**](ProductGroupWithProductsDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Updated group with remaining products |  -  |
| **404** | Group not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminGroupsControllerUpdate

> ProductGroupResponseDto adminGroupsControllerUpdate(id, updateProductGroupDto)

Update a product group

Updates an existing product group. All fields are optional.

### Example

```ts
import {
  Configuration,
  AdminProductGroupsApi,
} from '';
import type { AdminGroupsControllerUpdateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminProductGroupsApi(config);

  const body = {
    // string | Group UUID
    id: id_example,
    // UpdateProductGroupDto
    updateProductGroupDto: ...,
  } satisfies AdminGroupsControllerUpdateRequest;

  try {
    const data = await api.adminGroupsControllerUpdate(body);
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
| **id** | `string` | Group UUID | [Defaults to `undefined`] |
| **updateProductGroupDto** | [UpdateProductGroupDto](UpdateProductGroupDto.md) |  | |

### Return type

[**ProductGroupResponseDto**](ProductGroupResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Updated product group |  -  |
| **404** | Group not found |  -  |
| **409** | Slug already exists |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

