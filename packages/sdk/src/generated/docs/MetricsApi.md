# MetricsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**metricsControllerGetMetrics**](MetricsApi.md#metricscontrollergetmetrics) | **GET** /metrics | Get Prometheus metrics |



## metricsControllerGetMetrics

> string metricsControllerGetMetrics()

Get Prometheus metrics

### Example

```ts
import {
  Configuration,
  MetricsApi,
} from '';
import type { MetricsControllerGetMetricsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new MetricsApi();

  try {
    const data = await api.metricsControllerGetMetrics();
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

**string**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Prometheus metrics in text format |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

