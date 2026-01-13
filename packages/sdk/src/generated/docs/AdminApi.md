# AdminApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminControllerAdminRevealKey**](AdminApi.md#admincontrolleradminrevealkey) | **GET** /admin/keys/{keyId}/reveal | Admin reveal key (for support) |
| [**adminControllerBulkUpdateStatus**](AdminApi.md#admincontrollerbulkupdatestatus) | **PATCH** /admin/orders/bulk-status | Bulk update order status |
| [**adminControllerExportOrders**](AdminApi.md#admincontrollerexportorders) | **GET** /admin/orders/export | Export orders with date range |
| [**adminControllerGetDashboardStats**](AdminApi.md#admincontrollergetdashboardstats) | **GET** /admin/stats | Get dashboard statistics |
| [**adminControllerGetKeyAuditTrail**](AdminApi.md#admincontrollergetkeyaudittrail) | **GET** /admin/key-audit/{orderId} | Get key access audit trail |
| [**adminControllerGetOrderAnalytics**](AdminApi.md#admincontrollergetorderanalytics) | **GET** /admin/orders/analytics | Get order analytics |
| [**adminControllerGetOrders**](AdminApi.md#admincontrollergetorders) | **GET** /admin/orders | Get paginated list of orders |
| [**adminControllerGetPayments**](AdminApi.md#admincontrollergetpayments) | **GET** /admin/payments | Get paginated list of payments |
| [**adminControllerGetReservations**](AdminApi.md#admincontrollergetreservations) | **GET** /admin/reservations | Get paginated list of Kinguin reservations |
| [**adminControllerGetWebhookLog**](AdminApi.md#admincontrollergetwebhooklog) | **GET** /admin/webhook-logs/{id} | Get webhook log details |
| [**adminControllerGetWebhookLogs**](AdminApi.md#admincontrollergetwebhooklogs) | **GET** /admin/webhook-logs | Get paginated list of webhook logs |
| [**adminControllerReplayWebhook**](AdminApi.md#admincontrollerreplaywebhook) | **POST** /admin/webhook-logs/{id}/replay | Replay failed webhook |
| [**adminControllerResendKeys**](AdminApi.md#admincontrollerresendkeys) | **POST** /admin/orders/{id}/resend-keys | Resend key delivery email |
| [**adminControllerRetryFulfillment**](AdminApi.md#admincontrollerretryfulfillmentoperation) | **POST** /admin/orders/{id}/retry-fulfillment | Retry fulfillment for stuck order |
| [**adminControllerUpdateOrderStatus**](AdminApi.md#admincontrollerupdateorderstatus) | **PATCH** /admin/orders/{id}/status | Update order status |
| [**adminControllerUpdatePaymentStatus**](AdminApi.md#admincontrollerupdatepaymentstatus) | **PATCH** /admin/payments/{id}/status | Manually update payment status (admin override) |



## adminControllerAdminRevealKey

> AdminControllerAdminRevealKey200Response adminControllerAdminRevealKey(keyId)

Admin reveal key (for support)

Reveals key content for admin support purposes. This action is logged for audit.

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerAdminRevealKeyRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  const body = {
    // string
    keyId: keyId_example,
  } satisfies AdminControllerAdminRevealKeyRequest;

  try {
    const data = await api.adminControllerAdminRevealKey(body);
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
| **keyId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**AdminControllerAdminRevealKey200Response**](AdminControllerAdminRevealKey200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Key content revealed |  -  |
| **404** | Key not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerBulkUpdateStatus

> BulkUpdateStatusResponseDto adminControllerBulkUpdateStatus(bulkUpdateStatusDto)

Bulk update order status

Update status for multiple orders at once. Maximum 100 orders per request. All changes are logged.

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerBulkUpdateStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  const body = {
    // BulkUpdateStatusDto
    bulkUpdateStatusDto: ...,
  } satisfies AdminControllerBulkUpdateStatusRequest;

  try {
    const data = await api.adminControllerBulkUpdateStatus(body);
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
| **bulkUpdateStatusDto** | [BulkUpdateStatusDto](BulkUpdateStatusDto.md) |  | |

### Return type

[**BulkUpdateStatusResponseDto**](BulkUpdateStatusResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Bulk update completed |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerExportOrders

> Array&lt;AdminControllerExportOrders200ResponseInner&gt; adminControllerExportOrders(startDate, endDate, status, sourceType)

Export orders with date range

Returns all orders matching filters for export. Client handles CSV generation.

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerExportOrdersRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  const body = {
    // string | Start date (ISO 8601)
    startDate: 2025-01-01,
    // string | End date (ISO 8601)
    endDate: 2025-01-31,
    // string (optional)
    status: fulfilled,
    // 'custom' | 'kinguin' (optional)
    sourceType: sourceType_example,
  } satisfies AdminControllerExportOrdersRequest;

  try {
    const data = await api.adminControllerExportOrders(body);
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
| **startDate** | `string` | Start date (ISO 8601) | [Defaults to `undefined`] |
| **endDate** | `string` | End date (ISO 8601) | [Defaults to `undefined`] |
| **status** | `string` |  | [Optional] [Defaults to `undefined`] |
| **sourceType** | `custom`, `kinguin` |  | [Optional] [Defaults to `undefined`] [Enum: custom, kinguin] |

### Return type

[**Array&lt;AdminControllerExportOrders200ResponseInner&gt;**](AdminControllerExportOrders200ResponseInner.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Orders for export |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerGetDashboardStats

> DashboardStatsDto adminControllerGetDashboardStats()

Get dashboard statistics

Returns aggregated revenue, orders, users, and sales history

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerGetDashboardStatsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  try {
    const data = await api.adminControllerGetDashboardStats();
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

[**DashboardStatsDto**](DashboardStatsDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Dashboard statistics |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerGetKeyAuditTrail

> Array&lt;AdminControllerGetKeyAuditTrail200ResponseInner&gt; adminControllerGetKeyAuditTrail(orderId)

Get key access audit trail

Returns when keys were revealed to the customer with product info

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


## adminControllerGetOrderAnalytics

> OrderAnalyticsDto adminControllerGetOrderAnalytics(days)

Get order analytics

Returns aggregated order statistics: by status, by source type, daily volume, and rates

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerGetOrderAnalyticsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  const body = {
    // number | Number of days to analyze (default 30) (optional)
    days: 30,
  } satisfies AdminControllerGetOrderAnalyticsRequest;

  try {
    const data = await api.adminControllerGetOrderAnalytics(body);
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
| **days** | `number` | Number of days to analyze (default 30) | [Optional] [Defaults to `undefined`] |

### Return type

[**OrderAnalyticsDto**](OrderAnalyticsDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Order analytics |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerGetOrders

> AdminControllerGetOrders200Response adminControllerGetOrders(limit, offset, email, search, status, startDate, endDate, sourceType)

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
    // string | Search by email or order ID (optional)
    search: user@example.com,
    // string (optional)
    status: fulfilled,
    // string | Filter orders created on or after this date (ISO 8601) (optional)
    startDate: 2025-01-01,
    // string | Filter orders created on or before this date (ISO 8601) (optional)
    endDate: 2025-01-31,
    // 'custom' | 'kinguin' | Filter by fulfillment source type (optional)
    sourceType: sourceType_example,
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
| **search** | `string` | Search by email or order ID | [Optional] [Defaults to `undefined`] |
| **status** | `string` |  | [Optional] [Defaults to `undefined`] |
| **startDate** | `string` | Filter orders created on or after this date (ISO 8601) | [Optional] [Defaults to `undefined`] |
| **endDate** | `string` | Filter orders created on or before this date (ISO 8601) | [Optional] [Defaults to `undefined`] |
| **sourceType** | `custom`, `kinguin` | Filter by fulfillment source type | [Optional] [Defaults to `undefined`] [Enum: custom, kinguin] |

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

Returns payments with order info and extended transaction details, filtered by provider and status

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
| **200** | Paginated payments list with extended transaction data |  -  |

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

> AdminControllerGetWebhookLogs200Response adminControllerGetWebhookLogs(limit, offset, webhookType, paymentStatus, paymentId, orderId)

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
    // string | Filter webhook logs by payment ID (for IPN history) (optional)
    paymentId: paymentId_example,
    // string | Filter webhook logs by order ID (optional)
    orderId: orderId_example,
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
| **paymentId** | `string` | Filter webhook logs by payment ID (for IPN history) | [Optional] [Defaults to `undefined`] |
| **orderId** | `string` | Filter webhook logs by order ID | [Optional] [Defaults to `undefined`] |

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


## adminControllerResendKeys

> AdminControllerResendKeys200Response adminControllerResendKeys(id)

Resend key delivery email

Regenerates signed URLs for keys and resends delivery email to customer. Only works for fulfilled orders.

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerResendKeysRequest } from '';

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
  } satisfies AdminControllerResendKeysRequest;

  try {
    const data = await api.adminControllerResendKeys(body);
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

[**AdminControllerResendKeys200Response**](AdminControllerResendKeys200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Keys email resent successfully |  -  |
| **400** | Order not fulfilled - cannot resend keys |  -  |
| **404** | Order not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerRetryFulfillment

> AdminControllerRetryFulfillment200Response adminControllerRetryFulfillment(id, adminControllerRetryFulfillmentRequest)

Retry fulfillment for stuck order

Triggers the fulfillment process for orders stuck at paid/failed/waiting status. This actually reserves keys, encrypts them, and stores in R2. Use this instead of manually changing status to fulfilled.

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerRetryFulfillmentOperationRequest } from '';

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
    // AdminControllerRetryFulfillmentRequest (optional)
    adminControllerRetryFulfillmentRequest: ...,
  } satisfies AdminControllerRetryFulfillmentOperationRequest;

  try {
    const data = await api.adminControllerRetryFulfillment(body);
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
| **adminControllerRetryFulfillmentRequest** | [AdminControllerRetryFulfillmentRequest](AdminControllerRetryFulfillmentRequest.md) |  | [Optional] |

### Return type

[**AdminControllerRetryFulfillment200Response**](AdminControllerRetryFulfillment200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Fulfillment job queued successfully |  -  |
| **400** | Order not in retryable status |  -  |
| **404** | Order not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerUpdateOrderStatus

> AdminControllerUpdateOrderStatus200Response adminControllerUpdateOrderStatus(id, updateOrderStatusDto)

Update order status

Admin override to update order status. Used for manual refunds or corrections. All changes are logged.

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerUpdateOrderStatusRequest } from '';

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
    // UpdateOrderStatusDto
    updateOrderStatusDto: ...,
  } satisfies AdminControllerUpdateOrderStatusRequest;

  try {
    const data = await api.adminControllerUpdateOrderStatus(body);
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
| **updateOrderStatusDto** | [UpdateOrderStatusDto](UpdateOrderStatusDto.md) |  | |

### Return type

[**AdminControllerUpdateOrderStatus200Response**](AdminControllerUpdateOrderStatus200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Order status updated successfully |  -  |
| **400** | Invalid status transition |  -  |
| **404** | Order not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerUpdatePaymentStatus

> UpdatePaymentStatusResponseDto adminControllerUpdatePaymentStatus(id, updatePaymentStatusDto)

Manually update payment status (admin override)

Updates payment status for support edge cases. Requires reason for audit trail. Cannot change finalized payments.

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerUpdatePaymentStatusRequest } from '';

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
    // UpdatePaymentStatusDto
    updatePaymentStatusDto: ...,
  } satisfies AdminControllerUpdatePaymentStatusRequest;

  try {
    const data = await api.adminControllerUpdatePaymentStatus(body);
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
| **updatePaymentStatusDto** | [UpdatePaymentStatusDto](UpdatePaymentStatusDto.md) |  | |

### Return type

[**UpdatePaymentStatusResponseDto**](UpdatePaymentStatusResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Payment status updated successfully |  -  |
| **400** | Cannot update payment to this status (e.g., payment already finalized) |  -  |
| **404** | Payment not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

