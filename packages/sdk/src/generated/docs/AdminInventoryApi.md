# AdminInventoryApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminInventoryControllerAddItem**](AdminInventoryApi.md#admininventorycontrolleradditem) | **POST** /admin/products/{productId}/inventory | Add single item to inventory |
| [**adminInventoryControllerBulkImport**](AdminInventoryApi.md#admininventorycontrollerbulkimport) | **POST** /admin/products/{productId}/inventory/bulk | Bulk import items to inventory |
| [**adminInventoryControllerDeleteItem**](AdminInventoryApi.md#admininventorycontrollerdeleteitem) | **DELETE** /admin/products/{productId}/inventory/{itemId} | Delete an inventory item |
| [**adminInventoryControllerGetStats**](AdminInventoryApi.md#admininventorycontrollergetstats) | **GET** /admin/products/{productId}/inventory/stats | Get inventory statistics |
| [**adminInventoryControllerListItems**](AdminInventoryApi.md#admininventorycontrollerlistitems) | **GET** /admin/products/{productId}/inventory | List inventory items |
| [**adminInventoryControllerUpdateStatus**](AdminInventoryApi.md#admininventorycontrollerupdatestatus) | **PATCH** /admin/products/{productId}/inventory/{itemId}/status | Update item status |



## adminInventoryControllerAddItem

> InventoryItemResponseDto adminInventoryControllerAddItem(productId, addInventoryItemDto)

Add single item to inventory

Add a single digital item (key, account, code, etc.) to a custom product inventory. The item data will be encrypted at rest.

### Example

```ts
import {
  Configuration,
  AdminInventoryApi,
} from '';
import type { AdminInventoryControllerAddItemRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminInventoryApi(config);

  const body = {
    // string | Product UUID
    productId: productId_example,
    // AddInventoryItemDto
    addInventoryItemDto: ...,
  } satisfies AdminInventoryControllerAddItemRequest;

  try {
    const data = await api.adminInventoryControllerAddItem(body);
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
| **productId** | `string` | Product UUID | [Defaults to `undefined`] |
| **addInventoryItemDto** | [AddInventoryItemDto](AddInventoryItemDto.md) |  | |

### Return type

[**InventoryItemResponseDto**](InventoryItemResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Item added successfully |  -  |
| **400** | Invalid item data or type mismatch |  -  |
| **404** | Product not found |  -  |
| **409** | Duplicate item |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminInventoryControllerBulkImport

> BulkImportResultDto adminInventoryControllerBulkImport(productId, bulkImportInventoryDto)

Bulk import items to inventory

Import multiple items at once. Optionally skip duplicates. Maximum 1000 items per request.

### Example

```ts
import {
  Configuration,
  AdminInventoryApi,
} from '';
import type { AdminInventoryControllerBulkImportRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminInventoryApi(config);

  const body = {
    // string | Product UUID
    productId: productId_example,
    // BulkImportInventoryDto
    bulkImportInventoryDto: ...,
  } satisfies AdminInventoryControllerBulkImportRequest;

  try {
    const data = await api.adminInventoryControllerBulkImport(body);
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
| **productId** | `string` | Product UUID | [Defaults to `undefined`] |
| **bulkImportInventoryDto** | [BulkImportInventoryDto](BulkImportInventoryDto.md) |  | |

### Return type

[**BulkImportResultDto**](BulkImportResultDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Bulk import completed |  -  |
| **400** | Invalid request |  -  |
| **404** | Product not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminInventoryControllerDeleteItem

> adminInventoryControllerDeleteItem(productId, itemId)

Delete an inventory item

Permanently delete an available inventory item. Cannot delete reserved or sold items.

### Example

```ts
import {
  Configuration,
  AdminInventoryApi,
} from '';
import type { AdminInventoryControllerDeleteItemRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminInventoryApi(config);

  const body = {
    // string | Product UUID
    productId: productId_example,
    // string | Inventory item UUID
    itemId: itemId_example,
  } satisfies AdminInventoryControllerDeleteItemRequest;

  try {
    const data = await api.adminInventoryControllerDeleteItem(body);
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
| **productId** | `string` | Product UUID | [Defaults to `undefined`] |
| **itemId** | `string` | Inventory item UUID | [Defaults to `undefined`] |

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
| **204** | Item deleted |  -  |
| **400** | Cannot delete (wrong status) |  -  |
| **404** | Item not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminInventoryControllerGetStats

> InventoryStatsDto adminInventoryControllerGetStats(productId)

Get inventory statistics

Get statistics including counts by status, costs, revenue, and profit.

### Example

```ts
import {
  Configuration,
  AdminInventoryApi,
} from '';
import type { AdminInventoryControllerGetStatsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminInventoryApi(config);

  const body = {
    // string | Product UUID
    productId: productId_example,
  } satisfies AdminInventoryControllerGetStatsRequest;

  try {
    const data = await api.adminInventoryControllerGetStats(body);
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
| **productId** | `string` | Product UUID | [Defaults to `undefined`] |

### Return type

[**InventoryStatsDto**](InventoryStatsDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Inventory statistics |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminInventoryControllerListItems

> PaginatedInventoryDto adminInventoryControllerListItems(productId, status, supplier, page, limit, sortBy, sortDir)

List inventory items

Get paginated list of inventory items with optional filtering by status and supplier.

### Example

```ts
import {
  Configuration,
  AdminInventoryApi,
} from '';
import type { AdminInventoryControllerListItemsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminInventoryApi(config);

  const body = {
    // string | Product UUID
    productId: productId_example,
    // 'available' | 'reserved' | 'sold' | 'expired' | 'invalid' | Filter by status (optional)
    status: status_example,
    // string | Filter by supplier (optional)
    supplier: G2A,
    // number | Page number (optional)
    page: 8.14,
    // number | Items per page (optional)
    limit: 8.14,
    // 'uploadedAt' | 'soldAt' | 'expiresAt' | 'cost' | Sort by field (optional)
    sortBy: sortBy_example,
    // 'asc' | 'desc' | Sort direction (optional)
    sortDir: sortDir_example,
  } satisfies AdminInventoryControllerListItemsRequest;

  try {
    const data = await api.adminInventoryControllerListItems(body);
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
| **productId** | `string` | Product UUID | [Defaults to `undefined`] |
| **status** | `available`, `reserved`, `sold`, `expired`, `invalid` | Filter by status | [Optional] [Defaults to `undefined`] [Enum: available, reserved, sold, expired, invalid] |
| **supplier** | `string` | Filter by supplier | [Optional] [Defaults to `undefined`] |
| **page** | `number` | Page number | [Optional] [Defaults to `1`] |
| **limit** | `number` | Items per page | [Optional] [Defaults to `50`] |
| **sortBy** | `uploadedAt`, `soldAt`, `expiresAt`, `cost` | Sort by field | [Optional] [Defaults to `&#39;uploadedAt&#39;`] [Enum: uploadedAt, soldAt, expiresAt, cost] |
| **sortDir** | `asc`, `desc` | Sort direction | [Optional] [Defaults to `&#39;desc&#39;`] [Enum: asc, desc] |

### Return type

[**PaginatedInventoryDto**](PaginatedInventoryDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Paginated inventory list |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminInventoryControllerUpdateStatus

> InventoryItemResponseDto adminInventoryControllerUpdateStatus(productId, itemId, updateItemStatusDto)

Update item status

Mark an item as invalid (with reason) or restore it to available. Cannot modify sold items.

### Example

```ts
import {
  Configuration,
  AdminInventoryApi,
} from '';
import type { AdminInventoryControllerUpdateStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminInventoryApi(config);

  const body = {
    // string | Product UUID
    productId: productId_example,
    // string | Inventory item UUID
    itemId: itemId_example,
    // UpdateItemStatusDto
    updateItemStatusDto: ...,
  } satisfies AdminInventoryControllerUpdateStatusRequest;

  try {
    const data = await api.adminInventoryControllerUpdateStatus(body);
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
| **productId** | `string` | Product UUID | [Defaults to `undefined`] |
| **itemId** | `string` | Inventory item UUID | [Defaults to `undefined`] |
| **updateItemStatusDto** | [UpdateItemStatusDto](UpdateItemStatusDto.md) |  | |

### Return type

[**InventoryItemResponseDto**](InventoryItemResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Status updated |  -  |
| **400** | Invalid status change |  -  |
| **404** | Item not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

