# KinguinApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**kinguinControllerGetStatus**](KinguinApi.md#kinguincontrollergetstatus) | **GET** /kinguin/status/{orderId} | Query Kinguin order status |
| [**kinguinControllerHandleWebhook**](KinguinApi.md#kinguincontrollerhandlewebhook) | **POST** /kinguin/webhooks | Webhook receiver for Kinguin eCommerce API events |



## kinguinControllerGetStatus

> KinguinControllerGetStatus200Response kinguinControllerGetStatus(orderId)

Query Kinguin order status

### Example

```ts
import {
  Configuration,
  KinguinApi,
} from '';
import type { KinguinControllerGetStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new KinguinApi();

  const body = {
    // string
    orderId: orderId_example,
  } satisfies KinguinControllerGetStatusRequest;

  try {
    const data = await api.kinguinControllerGetStatus(body);
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
| **orderId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**KinguinControllerGetStatus200Response**](KinguinControllerGetStatus200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Order status retrieved |  -  |
| **404** | Order not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kinguinControllerHandleWebhook

> kinguinControllerHandleWebhook(xEventSecret, xEventName)

Webhook receiver for Kinguin eCommerce API events

### Example

```ts
import {
  Configuration,
  KinguinApi,
} from '';
import type { KinguinControllerHandleWebhookRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new KinguinApi();

  const body = {
    // string | Secret key for webhook verification
    xEventSecret: xEventSecret_example,
    // string | Webhook event type (order.status or product.update)
    xEventName: xEventName_example,
  } satisfies KinguinControllerHandleWebhookRequest;

  try {
    const data = await api.kinguinControllerHandleWebhook(body);
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
| **xEventSecret** | `string` | Secret key for webhook verification | [Defaults to `undefined`] |
| **xEventName** | `string` | Webhook event type (order.status or product.update) | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Webhook acknowledged |  -  |
| **400** | Invalid event type or payload |  -  |
| **401** | Invalid X-Event-Secret |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

