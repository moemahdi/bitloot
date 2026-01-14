# AdminKinguinBalanceApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**kinguinBalanceControllerGetAlerts**](AdminKinguinBalanceApi.md#kinguinbalancecontrollergetalerts) | **GET** /admin/kinguin/balance/alerts | Get balance alerts |
| [**kinguinBalanceControllerGetBalance**](AdminKinguinBalanceApi.md#kinguinbalancecontrollergetbalance) | **GET** /admin/kinguin/balance | Get current Kinguin balance |
| [**kinguinBalanceControllerGetBalanceHistory**](AdminKinguinBalanceApi.md#kinguinbalancecontrollergetbalancehistory) | **GET** /admin/kinguin/balance/history | Get balance history for charts |
| [**kinguinBalanceControllerGetDashboard**](AdminKinguinBalanceApi.md#kinguinbalancecontrollergetdashboard) | **GET** /admin/kinguin/balance/dashboard | Get complete Kinguin dashboard data |
| [**kinguinBalanceControllerGetRecentOrders**](AdminKinguinBalanceApi.md#kinguinbalancecontrollergetrecentorders) | **GET** /admin/kinguin/balance/orders | Get recent Kinguin orders |
| [**kinguinBalanceControllerGetSpending**](AdminKinguinBalanceApi.md#kinguinbalancecontrollergetspending) | **GET** /admin/kinguin/balance/spending | Get spending statistics for a period |
| [**kinguinBalanceControllerHealthCheck**](AdminKinguinBalanceApi.md#kinguinbalancecontrollerhealthcheck) | **GET** /admin/kinguin/balance/health | Kinguin API health check |



## kinguinBalanceControllerGetAlerts

> Array&lt;BalanceAlertDto&gt; kinguinBalanceControllerGetAlerts()

Get balance alerts

Returns active alerts based on balance thresholds and API status. Includes critical, warning, and info alerts.

### Example

```ts
import {
  Configuration,
  AdminKinguinBalanceApi,
} from '';
import type { KinguinBalanceControllerGetAlertsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminKinguinBalanceApi(config);

  try {
    const data = await api.kinguinBalanceControllerGetAlerts();
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

[**Array&lt;BalanceAlertDto&gt;**](BalanceAlertDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of active alerts |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kinguinBalanceControllerGetBalance

> KinguinBalanceDto kinguinBalanceControllerGetBalance()

Get current Kinguin balance

Returns current account balance in EUR with API connection status and environment info.

### Example

```ts
import {
  Configuration,
  AdminKinguinBalanceApi,
} from '';
import type { KinguinBalanceControllerGetBalanceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminKinguinBalanceApi(config);

  try {
    const data = await api.kinguinBalanceControllerGetBalance();
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

[**KinguinBalanceDto**](KinguinBalanceDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Current balance information |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kinguinBalanceControllerGetBalanceHistory

> Array&lt;BalanceHistoryPointDto&gt; kinguinBalanceControllerGetBalanceHistory(days)

Get balance history for charts

Returns estimated historical balance data for trend visualization. Balance is estimated by working backwards from current balance using order costs.

### Example

```ts
import {
  Configuration,
  AdminKinguinBalanceApi,
} from '';
import type { KinguinBalanceControllerGetBalanceHistoryRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminKinguinBalanceApi(config);

  const body = {
    // number | Number of days to include (default: 30, max: 90) (optional)
    days: 8.14,
  } satisfies KinguinBalanceControllerGetBalanceHistoryRequest;

  try {
    const data = await api.kinguinBalanceControllerGetBalanceHistory(body);
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
| **days** | `number` | Number of days to include (default: 30, max: 90) | [Optional] [Defaults to `30`] |

### Return type

[**Array&lt;BalanceHistoryPointDto&gt;**](BalanceHistoryPointDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Balance history points |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kinguinBalanceControllerGetDashboard

> KinguinDashboardDto kinguinBalanceControllerGetDashboard()

Get complete Kinguin dashboard data

Returns all balance data, spending stats, recent orders, and alerts in a single response. Optimized for dashboard loading.

### Example

```ts
import {
  Configuration,
  AdminKinguinBalanceApi,
} from '';
import type { KinguinBalanceControllerGetDashboardRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminKinguinBalanceApi(config);

  try {
    const data = await api.kinguinBalanceControllerGetDashboard();
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

[**KinguinDashboardDto**](KinguinDashboardDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Complete dashboard data |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kinguinBalanceControllerGetRecentOrders

> Array&lt;KinguinOrderSummaryDto&gt; kinguinBalanceControllerGetRecentOrders(limit)

Get recent Kinguin orders

Returns a list of recent Kinguin orders with product details, costs, and status.

### Example

```ts
import {
  Configuration,
  AdminKinguinBalanceApi,
} from '';
import type { KinguinBalanceControllerGetRecentOrdersRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminKinguinBalanceApi(config);

  const body = {
    // number | Number of orders to return (default: 10, max: 100) (optional)
    limit: 8.14,
  } satisfies KinguinBalanceControllerGetRecentOrdersRequest;

  try {
    const data = await api.kinguinBalanceControllerGetRecentOrders(body);
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
| **limit** | `number` | Number of orders to return (default: 10, max: 100) | [Optional] [Defaults to `10`] |

### Return type

[**Array&lt;KinguinOrderSummaryDto&gt;**](KinguinOrderSummaryDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of recent orders |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kinguinBalanceControllerGetSpending

> SpendingStatsDto kinguinBalanceControllerGetSpending(period)

Get spending statistics for a period

Returns aggregated spending data including total spent, order count, average order cost, and top products.

### Example

```ts
import {
  Configuration,
  AdminKinguinBalanceApi,
} from '';
import type { KinguinBalanceControllerGetSpendingRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminKinguinBalanceApi(config);

  const body = {
    // '24h' | '7d' | '30d' | Period for spending calculation (default: 24h) (optional)
    period: period_example,
  } satisfies KinguinBalanceControllerGetSpendingRequest;

  try {
    const data = await api.kinguinBalanceControllerGetSpending(body);
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
| **period** | `24h`, `7d`, `30d` | Period for spending calculation (default: 24h) | [Optional] [Defaults to `undefined`] [Enum: 24h, 7d, 30d] |

### Return type

[**SpendingStatsDto**](SpendingStatsDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Spending statistics |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kinguinBalanceControllerHealthCheck

> KinguinHealthDto kinguinBalanceControllerHealthCheck()

Kinguin API health check

Performs a health check on the Kinguin API connection and returns status with response time.

### Example

```ts
import {
  Configuration,
  AdminKinguinBalanceApi,
} from '';
import type { KinguinBalanceControllerHealthCheckRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminKinguinBalanceApi(config);

  try {
    const data = await api.kinguinBalanceControllerHealthCheck();
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

[**KinguinHealthDto**](KinguinHealthDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Health check result |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

