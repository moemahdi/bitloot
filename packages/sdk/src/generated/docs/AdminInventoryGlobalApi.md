# AdminInventoryGlobalApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminInventoryGlobalControllerExpireItems**](AdminInventoryGlobalApi.md#admininventoryglobalcontrollerexpireitems) | **POST** /admin/inventory/expire | Expire outdated items |
| [**adminInventoryGlobalControllerGetLowStock**](AdminInventoryGlobalApi.md#admininventoryglobalcontrollergetlowstock) | **GET** /admin/inventory/low-stock | Get products with low stock |
| [**adminInventoryGlobalControllerReleaseReservations**](AdminInventoryGlobalApi.md#admininventoryglobalcontrollerreleasereservations) | **POST** /admin/inventory/release-reservations | Release expired reservations |



## adminInventoryGlobalControllerExpireItems

> AdminInventoryGlobalControllerExpireItems200Response adminInventoryGlobalControllerExpireItems()

Expire outdated items

Manually trigger expiration of items past their expiration date. Returns count of expired items.

### Example

```ts
import {
  Configuration,
  AdminInventoryGlobalApi,
} from '';
import type { AdminInventoryGlobalControllerExpireItemsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminInventoryGlobalApi(config);

  try {
    const data = await api.adminInventoryGlobalControllerExpireItems();
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

[**AdminInventoryGlobalControllerExpireItems200Response**](AdminInventoryGlobalControllerExpireItems200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Number of items expired |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminInventoryGlobalControllerGetLowStock

> Array&lt;AdminInventoryGlobalControllerGetLowStock200ResponseInner&gt; adminInventoryGlobalControllerGetLowStock()

Get products with low stock

Get all custom products where available stock is at or below the low stock threshold.

### Example

```ts
import {
  Configuration,
  AdminInventoryGlobalApi,
} from '';
import type { AdminInventoryGlobalControllerGetLowStockRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminInventoryGlobalApi(config);

  try {
    const data = await api.adminInventoryGlobalControllerGetLowStock();
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

[**Array&lt;AdminInventoryGlobalControllerGetLowStock200ResponseInner&gt;**](AdminInventoryGlobalControllerGetLowStock200ResponseInner.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of low-stock products |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminInventoryGlobalControllerReleaseReservations

> AdminInventoryGlobalControllerReleaseReservations200Response adminInventoryGlobalControllerReleaseReservations(maxAgeMinutes)

Release expired reservations

Release inventory reservations that have been held longer than the specified time (default 30 minutes).

### Example

```ts
import {
  Configuration,
  AdminInventoryGlobalApi,
} from '';
import type { AdminInventoryGlobalControllerReleaseReservationsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminInventoryGlobalApi(config);

  const body = {
    // number
    maxAgeMinutes: 8.14,
  } satisfies AdminInventoryGlobalControllerReleaseReservationsRequest;

  try {
    const data = await api.adminInventoryGlobalControllerReleaseReservations(body);
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
| **maxAgeMinutes** | `number` |  | [Defaults to `undefined`] |

### Return type

[**AdminInventoryGlobalControllerReleaseReservations200Response**](AdminInventoryGlobalControllerReleaseReservations200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Number of reservations released |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

