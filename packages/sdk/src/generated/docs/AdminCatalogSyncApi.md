# AdminCatalogSyncApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminSyncControllerGetConfigStatus**](AdminCatalogSyncApi.md#adminsynccontrollergetconfigstatus) | **GET** /admin/catalog/sync/config | Check Kinguin integration status |
| [**adminSyncControllerGetSyncStatus**](AdminCatalogSyncApi.md#adminsynccontrollergetsyncstatus) | **GET** /admin/catalog/sync/status | Check sync job status |
| [**adminSyncControllerTriggerSync**](AdminCatalogSyncApi.md#adminsynccontrollertriggersync) | **POST** /admin/catalog/sync | Sync imported Kinguin products |



## adminSyncControllerGetConfigStatus

> SyncConfigStatusDto adminSyncControllerGetConfigStatus()

Check Kinguin integration status

Verify if Kinguin API is properly configured and accessible

### Example

```ts
import {
  Configuration,
  AdminCatalogSyncApi,
} from '';
import type { AdminSyncControllerGetConfigStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogSyncApi(config);

  try {
    const data = await api.adminSyncControllerGetConfigStatus();
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

[**SyncConfigStatusDto**](SyncConfigStatusDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Configuration status |  -  |
| **401** | Unauthorized |  -  |
| **403** | Forbidden - Admin only |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminSyncControllerGetSyncStatus

> SyncJobStatusResponseDto adminSyncControllerGetSyncStatus(jobId)

Check sync job status

Get detailed status of a specific Kinguin sync job by ID

### Example

```ts
import {
  Configuration,
  AdminCatalogSyncApi,
} from '';
import type { AdminSyncControllerGetSyncStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogSyncApi(config);

  const body = {
    // string | The BullMQ job ID to check
    jobId: jobId_example,
  } satisfies AdminSyncControllerGetSyncStatusRequest;

  try {
    const data = await api.adminSyncControllerGetSyncStatus(body);
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
| **jobId** | `string` | The BullMQ job ID to check | [Defaults to `undefined`] |

### Return type

[**SyncJobStatusResponseDto**](SyncJobStatusResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Job status retrieved |  -  |
| **400** | No job ID provided or invalid |  -  |
| **401** | Unauthorized |  -  |
| **403** | Forbidden - Admin only |  -  |
| **404** | Job not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminSyncControllerTriggerSync

> SyncJobResponseDto adminSyncControllerTriggerSync()

Sync imported Kinguin products

Updates all previously-imported Kinguin products with latest data from Kinguin API. Does NOT import new products.

### Example

```ts
import {
  Configuration,
  AdminCatalogSyncApi,
} from '';
import type { AdminSyncControllerTriggerSyncRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogSyncApi(config);

  try {
    const data = await api.adminSyncControllerTriggerSync();
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

[**SyncJobResponseDto**](SyncJobResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **202** | Sync job enqueued successfully |  -  |
| **401** | Unauthorized |  -  |
| **403** | Forbidden - Admin only |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

