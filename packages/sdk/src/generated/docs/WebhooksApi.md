# WebhooksApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**ipnHandlerControllerAdminListWebhooks**](WebhooksApi.md#ipnhandlercontrolleradminlistwebhooks) | **GET** /webhooks/admin/list | [ADMIN] List all webhook logs with pagination |
| [**ipnHandlerControllerHandleNowpaymentsIpn**](WebhooksApi.md#ipnhandlercontrollerhandlenowpaymentsipn) | **POST** /webhooks/nowpayments/ipn | NOWPayments IPN Webhook Handler |



## ipnHandlerControllerAdminListWebhooks

> IpnHandlerControllerAdminListWebhooks200Response ipnHandlerControllerAdminListWebhooks(page, limit, webhookType, processed, paymentStatus, orderId)

[ADMIN] List all webhook logs with pagination

Requires admin role in JWT token. Returns delivery history for all webhooks.

### Example

```ts
import {
  Configuration,
  WebhooksApi,
} from '';
import type { IpnHandlerControllerAdminListWebhooksRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WebhooksApi(config);

  const body = {
    // string
    page: page_example,
    // string
    limit: limit_example,
    // string
    webhookType: webhookType_example,
    // string
    processed: processed_example,
    // string
    paymentStatus: paymentStatus_example,
    // string
    orderId: orderId_example,
  } satisfies IpnHandlerControllerAdminListWebhooksRequest;

  try {
    const data = await api.ipnHandlerControllerAdminListWebhooks(body);
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
| **page** | `string` |  | [Defaults to `undefined`] |
| **limit** | `string` |  | [Defaults to `undefined`] |
| **webhookType** | `string` |  | [Defaults to `undefined`] |
| **processed** | `string` |  | [Defaults to `undefined`] |
| **paymentStatus** | `string` |  | [Defaults to `undefined`] |
| **orderId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**IpnHandlerControllerAdminListWebhooks200Response**](IpnHandlerControllerAdminListWebhooks200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Paginated webhook logs list |  -  |
| **401** | Unauthorized or missing JWT |  -  |
| **403** | Forbidden: user is not admin |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## ipnHandlerControllerHandleNowpaymentsIpn

> NowpaymentsIpnResponseDto ipnHandlerControllerHandleNowpaymentsIpn(xNowpaymentsSignature, xNOWPAYMENTSSIGNATURE, nowpaymentsIpnRequestDto)

NOWPayments IPN Webhook Handler

Receives instant payment notifications from NOWPayments. Verifies signature, deduplicates by payment ID, updates order status, and queues fulfillment if payment is complete. Always returns 200 OK to prevent webhook retries.

### Example

```ts
import {
  Configuration,
  WebhooksApi,
} from '';
import type { IpnHandlerControllerHandleNowpaymentsIpnRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new WebhooksApi();

  const body = {
    // string
    xNowpaymentsSignature: xNowpaymentsSignature_example,
    // string | HMAC-SHA512 signature of request body (hex string)
    xNOWPAYMENTSSIGNATURE: xNOWPAYMENTSSIGNATURE_example,
    // NowpaymentsIpnRequestDto
    nowpaymentsIpnRequestDto: ...,
  } satisfies IpnHandlerControllerHandleNowpaymentsIpnRequest;

  try {
    const data = await api.ipnHandlerControllerHandleNowpaymentsIpn(body);
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
| **xNowpaymentsSignature** | `string` |  | [Defaults to `undefined`] |
| **xNOWPAYMENTSSIGNATURE** | `string` | HMAC-SHA512 signature of request body (hex string) | [Defaults to `undefined`] |
| **nowpaymentsIpnRequestDto** | [NowpaymentsIpnRequestDto](NowpaymentsIpnRequestDto.md) |  | |

### Return type

[**NowpaymentsIpnResponseDto**](NowpaymentsIpnResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Webhook received and processed (or queued for processing). Always 200 OK regardless of outcome. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

