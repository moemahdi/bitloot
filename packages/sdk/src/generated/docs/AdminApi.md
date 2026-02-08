# AdminApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminControllerAdminRevealKey**](AdminApi.md#admincontrolleradminrevealkey) | **GET** /admin/keys/{keyId}/reveal | Admin reveal key (for support) |
| [**adminControllerBulkReplayWebhooks**](AdminApi.md#admincontrollerbulkreplaywebhooksoperation) | **POST** /admin/webhook-logs/bulk-replay | Bulk replay failed webhooks |
| [**adminControllerBulkUpdateStatus**](AdminApi.md#admincontrollerbulkupdatestatus) | **PATCH** /admin/orders/bulk-status | Bulk update order status |
| [**adminControllerClearWebhookLogs**](AdminApi.md#admincontrollerclearwebhooklogs) | **DELETE** /admin/webhook-logs | Clear webhook logs |
| [**adminControllerExportOrders**](AdminApi.md#admincontrollerexportorders) | **GET** /admin/orders/export | Export orders with date range |
| [**adminControllerGetAdjacentWebhooks**](AdminApi.md#admincontrollergetadjacentwebhooks) | **GET** /admin/webhook-logs/{id}/adjacent | Get adjacent webhooks for navigation |
| [**adminControllerGetDashboardStats**](AdminApi.md#admincontrollergetdashboardstats) | **GET** /admin/stats | Get dashboard statistics |
| [**adminControllerGetKeyAuditTrail**](AdminApi.md#admincontrollergetkeyaudittrail) | **GET** /admin/key-audit/{orderId} | Get key access audit trail |
| [**adminControllerGetOrderAnalytics**](AdminApi.md#admincontrollergetorderanalytics) | **GET** /admin/orders/analytics | Get order analytics |
| [**adminControllerGetOrderWebhooks**](AdminApi.md#admincontrollergetorderwebhooks) | **GET** /admin/orders/{orderId}/webhooks | Get webhooks for an order |
| [**adminControllerGetOrders**](AdminApi.md#admincontrollergetorders) | **GET** /admin/orders | Get paginated list of orders |
| [**adminControllerGetPayments**](AdminApi.md#admincontrollergetpayments) | **GET** /admin/payments | Get paginated list of payments |
| [**adminControllerGetReservations**](AdminApi.md#admincontrollergetreservations) | **GET** /admin/reservations | Get paginated list of Kinguin reservations |
| [**adminControllerGetWebhookLog**](AdminApi.md#admincontrollergetwebhooklog) | **GET** /admin/webhook-logs/{id} | Get webhook log details |
| [**adminControllerGetWebhookLogDetail**](AdminApi.md#admincontrollergetwebhooklogdetail) | **GET** /admin/webhook-logs/{id}/detail | Get full webhook log details |
| [**adminControllerGetWebhookLogs**](AdminApi.md#admincontrollergetwebhooklogs) | **GET** /admin/webhook-logs | Get paginated list of webhook logs |
| [**adminControllerGetWebhookLogsEnhanced**](AdminApi.md#admincontrollergetwebhooklogsenhanced) | **GET** /admin/webhook-logs/enhanced | Get enhanced webhook logs with advanced filtering |
| [**adminControllerGetWebhookStats**](AdminApi.md#admincontrollergetwebhookstats) | **GET** /admin/webhook-logs/stats | Get webhook statistics |
| [**adminControllerGetWebhookTimeline**](AdminApi.md#admincontrollergetwebhooktimeline) | **GET** /admin/webhook-logs/timeline | Get webhook activity timeline |
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


## adminControllerBulkReplayWebhooks

> adminControllerBulkReplayWebhooks(adminControllerBulkReplayWebhooksRequest)

Bulk replay failed webhooks

Marks multiple webhooks for reprocessing

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerBulkReplayWebhooksOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  const body = {
    // AdminControllerBulkReplayWebhooksRequest
    adminControllerBulkReplayWebhooksRequest: ...,
  } satisfies AdminControllerBulkReplayWebhooksOperationRequest;

  try {
    const data = await api.adminControllerBulkReplayWebhooks(body);
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
| **adminControllerBulkReplayWebhooksRequest** | [AdminControllerBulkReplayWebhooksRequest](AdminControllerBulkReplayWebhooksRequest.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Bulk replay results |  -  |

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


## adminControllerClearWebhookLogs

> AdminControllerClearWebhookLogs200Response adminControllerClearWebhookLogs(type)

Clear webhook logs

Deletes webhook logs. Optionally filter by type (e.g. kinguin_product_update)

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerClearWebhookLogsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  const body = {
    // string | Filter by webhook type (optional)
    type: type_example,
  } satisfies AdminControllerClearWebhookLogsRequest;

  try {
    const data = await api.adminControllerClearWebhookLogs(body);
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
| **type** | `string` | Filter by webhook type | [Optional] [Defaults to `undefined`] |

### Return type

[**AdminControllerClearWebhookLogs200Response**](AdminControllerClearWebhookLogs200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Number of deleted logs |  -  |

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


## adminControllerGetAdjacentWebhooks

> AdminControllerGetAdjacentWebhooks200Response adminControllerGetAdjacentWebhooks(id)

Get adjacent webhooks for navigation

Returns previous and next webhook IDs for detail page navigation

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerGetAdjacentWebhooksRequest } from '';

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
  } satisfies AdminControllerGetAdjacentWebhooksRequest;

  try {
    const data = await api.adminControllerGetAdjacentWebhooks(body);
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

[**AdminControllerGetAdjacentWebhooks200Response**](AdminControllerGetAdjacentWebhooks200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Adjacent webhook IDs |  -  |
| **404** | Webhook log not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerGetDashboardStats

> DashboardStatsDto adminControllerGetDashboardStats(timeRange)

Get dashboard statistics

Returns aggregated revenue, orders, users, and sales history filtered by time range

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

  const body = {
    // '24h' | '7d' | '30d' | '90d' | 'all' | Time range for filtering stats (default: 7d) (optional)
    timeRange: timeRange_example,
  } satisfies AdminControllerGetDashboardStatsRequest;

  try {
    const data = await api.adminControllerGetDashboardStats(body);
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
| **timeRange** | `24h`, `7d`, `30d`, `90d`, `all` | Time range for filtering stats (default: 7d) | [Optional] [Defaults to `undefined`] [Enum: 24h, 7d, 30d, 90d, all] |

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


## adminControllerGetOrderWebhooks

> Array&lt;AdminControllerGetOrderWebhooks200ResponseInner&gt; adminControllerGetOrderWebhooks(orderId)

Get webhooks for an order

Returns all webhooks associated with a specific order (timeline view)

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerGetOrderWebhooksRequest } from '';

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
  } satisfies AdminControllerGetOrderWebhooksRequest;

  try {
    const data = await api.adminControllerGetOrderWebhooks(body);
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

[**Array&lt;AdminControllerGetOrderWebhooks200ResponseInner&gt;**](AdminControllerGetOrderWebhooks200ResponseInner.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Order webhook history |  -  |

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


## adminControllerGetWebhookLogDetail

> AdminControllerGetWebhookLogDetail200Response adminControllerGetWebhookLogDetail(id)

Get full webhook log details

Returns complete webhook log including payload, result, and all metadata

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerGetWebhookLogDetailRequest } from '';

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
  } satisfies AdminControllerGetWebhookLogDetailRequest;

  try {
    const data = await api.adminControllerGetWebhookLogDetail(body);
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

[**AdminControllerGetWebhookLogDetail200Response**](AdminControllerGetWebhookLogDetail200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Full webhook log details |  -  |
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


## adminControllerGetWebhookLogsEnhanced

> PaginatedWebhookLogsDto adminControllerGetWebhookLogsEnhanced(limit, offset, webhookType, paymentStatus, signatureValid, startDate, endDate, search, sourceIp, orderId, paymentId, sortBy, sortOrder)

Get enhanced webhook logs with advanced filtering

Returns paginated webhook logs with full filter options

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerGetWebhookLogsEnhancedRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  const body = {
    // number (optional)
    limit: 20,
    // number (optional)
    offset: 0,
    // string (optional)
    webhookType: webhookType_example,
    // string (optional)
    paymentStatus: paymentStatus_example,
    // 'true' | 'false' (optional)
    signatureValid: signatureValid_example,
    // string (optional)
    startDate: startDate_example,
    // string (optional)
    endDate: endDate_example,
    // string (optional)
    search: search_example,
    // string (optional)
    sourceIp: sourceIp_example,
    // string (optional)
    orderId: orderId_example,
    // string (optional)
    paymentId: paymentId_example,
    // 'createdAt' | 'paymentStatus' | 'webhookType' (optional)
    sortBy: sortBy_example,
    // 'ASC' | 'DESC' (optional)
    sortOrder: sortOrder_example,
  } satisfies AdminControllerGetWebhookLogsEnhancedRequest;

  try {
    const data = await api.adminControllerGetWebhookLogsEnhanced(body);
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
| **signatureValid** | `true`, `false` |  | [Optional] [Defaults to `undefined`] [Enum: true, false] |
| **startDate** | `string` |  | [Optional] [Defaults to `undefined`] |
| **endDate** | `string` |  | [Optional] [Defaults to `undefined`] |
| **search** | `string` |  | [Optional] [Defaults to `undefined`] |
| **sourceIp** | `string` |  | [Optional] [Defaults to `undefined`] |
| **orderId** | `string` |  | [Optional] [Defaults to `undefined`] |
| **paymentId** | `string` |  | [Optional] [Defaults to `undefined`] |
| **sortBy** | `createdAt`, `paymentStatus`, `webhookType` |  | [Optional] [Defaults to `undefined`] [Enum: createdAt, paymentStatus, webhookType] |
| **sortOrder** | `ASC`, `DESC` |  | [Optional] [Defaults to `undefined`] [Enum: ASC, DESC] |

### Return type

[**PaginatedWebhookLogsDto**](PaginatedWebhookLogsDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Paginated enhanced webhook logs |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerGetWebhookStats

> WebhookStatsDto adminControllerGetWebhookStats(period)

Get webhook statistics

Returns aggregated webhook statistics for the specified period

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerGetWebhookStatsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  const body = {
    // '24h' | '7d' | '30d' | Time period for statistics (optional)
    period: period_example,
  } satisfies AdminControllerGetWebhookStatsRequest;

  try {
    const data = await api.adminControllerGetWebhookStats(body);
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
| **period** | `24h`, `7d`, `30d` | Time period for statistics | [Optional] [Defaults to `undefined`] [Enum: 24h, 7d, 30d] |

### Return type

[**WebhookStatsDto**](WebhookStatsDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Webhook statistics |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerGetWebhookTimeline

> WebhookTimelineDto adminControllerGetWebhookTimeline(period, interval)

Get webhook activity timeline

Returns time-series data for webhook activity visualization

### Example

```ts
import {
  Configuration,
  AdminApi,
} from '';
import type { AdminControllerGetWebhookTimelineRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminApi(config);

  const body = {
    // '24h' | '7d' | '30d' (optional)
    period: period_example,
    // 'hour' | 'day' (optional)
    interval: interval_example,
  } satisfies AdminControllerGetWebhookTimelineRequest;

  try {
    const data = await api.adminControllerGetWebhookTimeline(body);
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
| **period** | `24h`, `7d`, `30d` |  | [Optional] [Defaults to `undefined`] [Enum: 24h, 7d, 30d] |
| **interval** | `hour`, `day` |  | [Optional] [Defaults to `undefined`] [Enum: hour, day] |

### Return type

[**WebhookTimelineDto**](WebhookTimelineDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Timeline data |  -  |

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

