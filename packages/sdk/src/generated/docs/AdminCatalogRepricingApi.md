# AdminCatalogRepricingApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminRepriceControllerGetRepriceStatus**](AdminCatalogRepricingApi.md#adminrepricecontrollergetrepricestatus) | **GET** /admin/catalog/reprice/status | Check repricing job status |
| [**adminRepriceControllerTriggerReprice**](AdminCatalogRepricingApi.md#adminrepricecontrollertriggerreprice) | **POST** /admin/catalog/reprice | Trigger repricing job |



## adminRepriceControllerGetRepriceStatus

> object adminRepriceControllerGetRepriceStatus(jobId)

Check repricing job status

Get detailed status of a specific repricing job by ID

### Example

```ts
import {
  Configuration,
  AdminCatalogRepricingApi,
} from '';
import type { AdminRepriceControllerGetRepriceStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogRepricingApi(config);

  const body = {
    // string | The BullMQ job ID to check
    jobId: jobId_example,
  } satisfies AdminRepriceControllerGetRepriceStatusRequest;

  try {
    const data = await api.adminRepriceControllerGetRepriceStatus(body);
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

**object**

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Job status retrieved |  -  |
| **401** | Unauthorized |  -  |
| **403** | Forbidden - Admin only |  -  |
| **404** | Job not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminRepriceControllerTriggerReprice

> object adminRepriceControllerTriggerReprice(productId)

Trigger repricing job

Enqueues a BullMQ job to recalculate prices for all products or a specific product based on dynamic pricing rules

### Example

```ts
import {
  Configuration,
  AdminCatalogRepricingApi,
} from '';
import type { AdminRepriceControllerTriggerRepriceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogRepricingApi(config);

  const body = {
    // string | Optional: Reprice only this product ID (optional)
    productId: productId_example,
  } satisfies AdminRepriceControllerTriggerRepriceRequest;

  try {
    const data = await api.adminRepriceControllerTriggerReprice(body);
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
| **productId** | `string` | Optional: Reprice only this product ID | [Optional] [Defaults to `undefined`] |

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
| **202** | Repricing job enqueued successfully |  -  |
| **401** | Unauthorized |  -  |
| **403** | Forbidden - Admin only |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

