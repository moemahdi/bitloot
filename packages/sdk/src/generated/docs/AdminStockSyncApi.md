# AdminStockSyncApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminStockSyncControllerCheckLowStock**](AdminStockSyncApi.md#adminstocksynccontrollerchecklowstock) | **GET** /admin/inventory/sync/low-stock | Check for low stock products |
| [**adminStockSyncControllerExpireItems**](AdminStockSyncApi.md#adminstocksynccontrollerexpireitems) | **POST** /admin/inventory/sync/expire-items | Expire outdated inventory items |
| [**adminStockSyncControllerGetGlobalStats**](AdminStockSyncApi.md#adminstocksynccontrollergetglobalstats) | **GET** /admin/inventory/sync/stats | Get global inventory statistics |
| [**adminStockSyncControllerReleaseReservations**](AdminStockSyncApi.md#adminstocksynccontrollerreleasereservations) | **POST** /admin/inventory/sync/release-reservations | Release stale inventory reservations |
| [**adminStockSyncControllerRunAllSyncJobs**](AdminStockSyncApi.md#adminstocksynccontrollerrunallsyncjobs) | **POST** /admin/inventory/sync/run-all | Run all inventory sync jobs |
| [**adminStockSyncControllerSyncStockCounts**](AdminStockSyncApi.md#adminstocksynccontrollersyncstockcounts) | **POST** /admin/inventory/sync/sync-counts | Sync stock counts on products |



## adminStockSyncControllerCheckLowStock

> Array&lt;AdminStockSyncControllerCheckLowStock200ResponseInner&gt; adminStockSyncControllerCheckLowStock()

Check for low stock products

Returns products that are at or below their low stock threshold

### Example

```ts
import {
  Configuration,
  AdminStockSyncApi,
} from '';
import type { AdminStockSyncControllerCheckLowStockRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminStockSyncApi(config);

  try {
    const data = await api.adminStockSyncControllerCheckLowStock();
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

[**Array&lt;AdminStockSyncControllerCheckLowStock200ResponseInner&gt;**](AdminStockSyncControllerCheckLowStock200ResponseInner.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Low stock alerts |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminStockSyncControllerExpireItems

> AdminStockSyncControllerExpireItems200Response adminStockSyncControllerExpireItems()

Expire outdated inventory items

Marks items past their expiresAt date as expired

### Example

```ts
import {
  Configuration,
  AdminStockSyncApi,
} from '';
import type { AdminStockSyncControllerExpireItemsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminStockSyncApi(config);

  try {
    const data = await api.adminStockSyncControllerExpireItems();
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

[**AdminStockSyncControllerExpireItems200Response**](AdminStockSyncControllerExpireItems200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Expiration results |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminStockSyncControllerGetGlobalStats

> object adminStockSyncControllerGetGlobalStats()

Get global inventory statistics

Returns aggregate statistics across all custom products inventory

### Example

```ts
import {
  Configuration,
  AdminStockSyncApi,
} from '';
import type { AdminStockSyncControllerGetGlobalStatsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminStockSyncApi(config);

  try {
    const data = await api.adminStockSyncControllerGetGlobalStats();
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

**object**

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Global inventory statistics |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminStockSyncControllerReleaseReservations

> AdminStockSyncControllerReleaseReservations200Response adminStockSyncControllerReleaseReservations()

Release stale inventory reservations

Releases reservations older than 30 minutes that were not fulfilled

### Example

```ts
import {
  Configuration,
  AdminStockSyncApi,
} from '';
import type { AdminStockSyncControllerReleaseReservationsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminStockSyncApi(config);

  try {
    const data = await api.adminStockSyncControllerReleaseReservations();
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

[**AdminStockSyncControllerReleaseReservations200Response**](AdminStockSyncControllerReleaseReservations200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Release results |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminStockSyncControllerRunAllSyncJobs

> object adminStockSyncControllerRunAllSyncJobs()

Run all inventory sync jobs

Manually triggers all sync jobs: expiration, reservation cleanup, low stock check, and stock count sync

### Example

```ts
import {
  Configuration,
  AdminStockSyncApi,
} from '';
import type { AdminStockSyncControllerRunAllSyncJobsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminStockSyncApi(config);

  try {
    const data = await api.adminStockSyncControllerRunAllSyncJobs();
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

**object**

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Sync job results |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminStockSyncControllerSyncStockCounts

> AdminStockSyncControllerSyncStockCounts200Response adminStockSyncControllerSyncStockCounts()

Sync stock counts on products

Ensures product stock counts match actual inventory counts

### Example

```ts
import {
  Configuration,
  AdminStockSyncApi,
} from '';
import type { AdminStockSyncControllerSyncStockCountsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminStockSyncApi(config);

  try {
    const data = await api.adminStockSyncControllerSyncStockCounts();
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

[**AdminStockSyncControllerSyncStockCounts200Response**](AdminStockSyncControllerSyncStockCounts200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Sync results |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

