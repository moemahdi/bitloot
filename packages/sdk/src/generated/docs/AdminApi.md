# AdminApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminControllerGetKeyAuditTrail**](AdminApi.md#admincontrollergetkeyaudittrail) | **GET** /admin/key-audit/{orderId} | Get key access audit trail |
| [**adminControllerGetOrders**](AdminApi.md#admincontrollergetorders) | **GET** /admin/orders | Get paginated list of orders |
| [**adminControllerGetPayments**](AdminApi.md#admincontrollergetpayments) | **GET** /admin/payments | Get paginated list of payments |
| [**adminControllerGetReservations**](AdminApi.md#admincontrollergetreservations) | **GET** /admin/reservations | Get paginated list of Kinguin reservations |
| [**adminControllerGetWebhookLog**](AdminApi.md#admincontrollergetwebhooklog) | **GET** /admin/webhook-logs/{id} | Get webhook log details |
| [**adminControllerGetWebhookLogs**](AdminApi.md#admincontrollergetwebhooklogs) | **GET** /admin/webhook-logs | Get paginated list of webhook logs |
| [**adminControllerReplayWebhook**](AdminApi.md#admincontrollerreplaywebhook) | **POST** /admin/webhook-logs/{id}/replay | Replay failed webhook |



## adminControllerGetKeyAuditTrail

> Array&lt;AdminControllerGetKeyAuditTrail200ResponseInner&gt; adminControllerGetKeyAuditTrail(orderId)

Get key access audit trail

Returns when keys were revealed to the customer

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerGetKeyAuditTrailRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  const body = {
    // string
    orderId: orderId_example,
  } satisfies AdminControllerGetKeyAuditTrailRequest;

  try {
    const data = await api.adminControllerGetKeyAuditTrail(body);
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

[**Array&lt;AdminControllerGetKeyAuditTrail200ResponseInner&gt;**](AdminControllerGetKeyAuditTrail200ResponseInner.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Key access audit trail |  -  |
| **404** | Order not found or has no keys |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerGetOrders

> AdminControllerGetOrders200Response adminControllerGetOrders(limit, offset, email, status)

Get paginated list of orders

Returns all orders with payment and fulfillment status

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerGetOrdersRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  const body = {
    // number (optional)
    limit: 50,
    // number (optional)
    offset: 0,
    // string (optional)
    email: user@example.com,
    // string (optional)
    status: fulfilled,
  } satisfies AdminControllerGetOrdersRequest;

  try {
    const data = await api.adminControllerGetOrders(body);
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
| **limit** | `number` |  | [Optional] [Defaults to `undefined`] |
| **offset** | `number` |  | [Optional] [Defaults to `undefined`] |
| **email** | `string` |  | [Optional] [Defaults to `undefined`] |
| **status** | `string` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**AdminControllerGetOrders200Response**](AdminControllerGetOrders200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Paginated orders list |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerGetPayments

> AdminControllerGetPayments200Response adminControllerGetPayments(limit, offset, provider, status)

Get paginated list of payments

Returns payments with order info, filtered by provider and status

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerGetPaymentsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  const body = {
    // number (optional)
    limit: 50,
    // number (optional)
    offset: 0,
    // string (optional)
    provider: nowpayments,
    // string (optional)
    status: finished,
  } satisfies AdminControllerGetPaymentsRequest;

  try {
    const data = await api.adminControllerGetPayments(body);
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
| **limit** | `number` |  | [Optional] [Defaults to `undefined`] |
| **offset** | `number` |  | [Optional] [Defaults to `undefined`] |
| **provider** | `string` |  | [Optional] [Defaults to `undefined`] |
| **status** | `string` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**AdminControllerGetPayments200Response**](AdminControllerGetPayments200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Paginated payments list |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerGetReservations

> AdminControllerGetReservations200Response adminControllerGetReservations(limit, offset, kinguinReservationId, status)

Get paginated list of Kinguin reservations

Returns orders with Kinguin reservation status and ID

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerGetReservationsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  const body = {
    // number (optional)
    limit: 50,
    // number (optional)
    offset: 0,
    // string (optional)
    kinguinReservationId: res_123456,
    // string (optional)
    status: fulfilled,
  } satisfies AdminControllerGetReservationsRequest;

  try {
    const data = await api.adminControllerGetReservations(body);
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
| **limit** | `number` |  | [Optional] [Defaults to `undefined`] |
| **offset** | `number` |  | [Optional] [Defaults to `undefined`] |
| **kinguinReservationId** | `string` |  | [Optional] [Defaults to `undefined`] |
| **status** | `string` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**AdminControllerGetReservations200Response**](AdminControllerGetReservations200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Paginated reservations list |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerGetWebhookLog

> AdminControllerGetWebhookLog200Response adminControllerGetWebhookLog(id)

Get webhook log details

Returns full webhook log with payload for inspection

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerGetWebhookLogRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminControllerGetWebhookLogRequest;

  try {
    const data = await api.adminControllerGetWebhookLog(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**AdminControllerGetWebhookLog200Response**](AdminControllerGetWebhookLog200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Webhook log details with payload |  -  |
| **404** | Webhook log not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerGetWebhookLogs

> AdminControllerGetWebhookLogs200Response adminControllerGetWebhookLogs(limit, offset, webhookType, paymentStatus)

Get paginated list of webhook logs

Returns webhook history with processing status

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerGetWebhookLogsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  const body = {
    // number (optional)
    limit: 50,
    // number (optional)
    offset: 0,
    // string (optional)
    webhookType: nowpayments_ipn,
    // string (optional)
    paymentStatus: processed,
  } satisfies AdminControllerGetWebhookLogsRequest;

  try {
    const data = await api.adminControllerGetWebhookLogs(body);
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
| **limit** | `number` |  | [Optional] [Defaults to `undefined`] |
| **offset** | `number` |  | [Optional] [Defaults to `undefined`] |
| **webhookType** | `string` |  | [Optional] [Defaults to `undefined`] |
| **paymentStatus** | `string` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**AdminControllerGetWebhookLogs200Response**](AdminControllerGetWebhookLogs200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Paginated webhook logs |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerReplayWebhook

> adminControllerReplayWebhook(id)

Replay failed webhook

Marks webhook for reprocessing by resetting status to pending

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerReplayWebhookRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminControllerReplayWebhookRequest;

  try {
    const data = await api.adminControllerReplayWebhook(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

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
| **200** | Webhook marked for replay |  -  |
| **400** | Cannot replay processed webhook |  -  |
| **404** | Webhook log not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

