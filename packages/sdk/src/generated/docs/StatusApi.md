# StatusApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**statusControllerCheckMaintenance**](StatusApi.md#statuscontrollercheckmaintenance) | **GET** /status/maintenance | Check maintenance mode status |
| [**statusControllerGetStatus**](StatusApi.md#statuscontrollergetstatus) | **GET** /status | Basic status check |



## statusControllerCheckMaintenance

> StatusControllerCheckMaintenance200Response statusControllerCheckMaintenance()

Check maintenance mode status

Public endpoint to check if the store is in maintenance mode

### Example

```ts
import {
  Configuration,
  StatusApi,
} from '';
import type { StatusControllerCheckMaintenanceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new StatusApi();

  try {
    const data = await api.statusControllerCheckMaintenance();
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

[**StatusControllerCheckMaintenance200Response**](StatusControllerCheckMaintenance200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Maintenance status |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## statusControllerGetStatus

> StatusControllerGetStatus200Response statusControllerGetStatus()

Basic status check

### Example

```ts
import {
  Configuration,
  StatusApi,
} from '';
import type { StatusControllerGetStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new StatusApi();

  try {
    const data = await api.statusControllerGetStatus();
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

[**StatusControllerGetStatus200Response**](StatusControllerGetStatus200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Service is alive |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

