# KinguinApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**kinguinControllerGetStatus**](KinguinApi.md#kinguincontrollergetstatus) | **GET** /kinguin/status/{reservationId} | Query Kinguin order delivery status |
| [**kinguinControllerHandleWebhook**](KinguinApi.md#kinguincontrollerhandlewebhook) | **POST** /kinguin/webhooks | Webhook receiver for Kinguin order deliveries |



## kinguinControllerGetStatus

> KinguinControllerGetStatus200Response kinguinControllerGetStatus(reservationId)

Query Kinguin order delivery status

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
    reservationId: reservationId_example,
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
| **reservationId** | `string` |  | [Defaults to `undefined`] |

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
| **404** | Reservation not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kinguinControllerHandleWebhook

> KinguinControllerHandleWebhook200Response kinguinControllerHandleWebhook(xKINGUINSIGNATURE, webhookPayloadDto)

Webhook receiver for Kinguin order deliveries

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
    // string | HMAC signature for webhook verification
    xKINGUINSIGNATURE: xKINGUINSIGNATURE_example,
    // WebhookPayloadDto
    webhookPayloadDto: ...,
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
| **xKINGUINSIGNATURE** | `string` | HMAC signature for webhook verification | [Defaults to `undefined`] |
| **webhookPayloadDto** | [WebhookPayloadDto](WebhookPayloadDto.md) |  | |

### Return type

[**KinguinControllerHandleWebhook200Response**](KinguinControllerHandleWebhook200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **401** | Invalid webhook signature |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

