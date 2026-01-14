# AdminKinguinProfitAnalyticsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**kinguinProfitControllerGetDashboard**](AdminKinguinProfitAnalyticsApi.md#kinguinprofitcontrollergetdashboard) | **GET** /admin/kinguin/profit/dashboard | Get profit dashboard |
| [**kinguinProfitControllerGetLowMarginProducts**](AdminKinguinProfitAnalyticsApi.md#kinguinprofitcontrollergetlowmarginproducts) | **GET** /admin/kinguin/profit/low-margin | Get low margin products |
| [**kinguinProfitControllerGetMarginDistribution**](AdminKinguinProfitAnalyticsApi.md#kinguinprofitcontrollergetmargindistribution) | **GET** /admin/kinguin/profit/distribution | Get margin distribution |
| [**kinguinProfitControllerGetProductProfitability**](AdminKinguinProfitAnalyticsApi.md#kinguinprofitcontrollergetproductprofitability) | **GET** /admin/kinguin/profit/products | Get product profitability |
| [**kinguinProfitControllerGetProfitAlerts**](AdminKinguinProfitAnalyticsApi.md#kinguinprofitcontrollergetprofitalerts) | **GET** /admin/kinguin/profit/alerts | Get profit alerts |
| [**kinguinProfitControllerGetProfitTrend**](AdminKinguinProfitAnalyticsApi.md#kinguinprofitcontrollergetprofittrend) | **GET** /admin/kinguin/profit/trend | Get profit trend |
| [**kinguinProfitControllerGetSummary**](AdminKinguinProfitAnalyticsApi.md#kinguinprofitcontrollergetsummary) | **GET** /admin/kinguin/profit/summary | Get profit summary |
| [**kinguinProfitControllerGetTopProducts**](AdminKinguinProfitAnalyticsApi.md#kinguinprofitcontrollergettopproducts) | **GET** /admin/kinguin/profit/top-products | Get top profitable products |



## kinguinProfitControllerGetDashboard

> ProfitDashboardDto kinguinProfitControllerGetDashboard()

Get profit dashboard

Returns all profit metrics in a single request for dashboard display

### Example

```ts
import {
  Configuration,
  AdminKinguinProfitAnalyticsApi,
} from '';
import type { KinguinProfitControllerGetDashboardRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminKinguinProfitAnalyticsApi(config);

  try {
    const data = await api.kinguinProfitControllerGetDashboard();
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

[**ProfitDashboardDto**](ProfitDashboardDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Profit dashboard data |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kinguinProfitControllerGetLowMarginProducts

> Array&lt;ProductProfitDto&gt; kinguinProfitControllerGetLowMarginProducts(threshold, limit)

Get low margin products

Returns products with profit margin below the specified threshold

### Example

```ts
import {
  Configuration,
  AdminKinguinProfitAnalyticsApi,
} from '';
import type { KinguinProfitControllerGetLowMarginProductsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminKinguinProfitAnalyticsApi(config);

  const body = {
    // number | Margin threshold percentage (products below this are considered low margin) (optional)
    threshold: 8.14,
    // number | Maximum number of products to return (optional)
    limit: 8.14,
  } satisfies KinguinProfitControllerGetLowMarginProductsRequest;

  try {
    const data = await api.kinguinProfitControllerGetLowMarginProducts(body);
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
| **threshold** | `number` | Margin threshold percentage (products below this are considered low margin) | [Optional] [Defaults to `15`] |
| **limit** | `number` | Maximum number of products to return | [Optional] [Defaults to `10`] |

### Return type

[**Array&lt;ProductProfitDto&gt;**](ProductProfitDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Low margin products |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kinguinProfitControllerGetMarginDistribution

> MarginDistributionDto kinguinProfitControllerGetMarginDistribution(period)

Get margin distribution

Returns margin distribution histogram for analysis

### Example

```ts
import {
  Configuration,
  AdminKinguinProfitAnalyticsApi,
} from '';
import type { KinguinProfitControllerGetMarginDistributionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminKinguinProfitAnalyticsApi(config);

  const body = {
    // '24h' | '7d' | '30d' | '90d' | 'total' | Time period for calculation (optional)
    period: period_example,
  } satisfies KinguinProfitControllerGetMarginDistributionRequest;

  try {
    const data = await api.kinguinProfitControllerGetMarginDistribution(body);
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
| **period** | `24h`, `7d`, `30d`, `90d`, `total` | Time period for calculation | [Optional] [Defaults to `undefined`] [Enum: 24h, 7d, 30d, 90d, total] |

### Return type

[**MarginDistributionDto**](MarginDistributionDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Margin distribution data |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kinguinProfitControllerGetProductProfitability

> ProductProfitListDto kinguinProfitControllerGetProductProfitability(limit, period)

Get product profitability

Returns profitability metrics for each product, sorted by total profit

### Example

```ts
import {
  Configuration,
  AdminKinguinProfitAnalyticsApi,
} from '';
import type { KinguinProfitControllerGetProductProfitabilityRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminKinguinProfitAnalyticsApi(config);

  const body = {
    // number | Maximum number of products to return (optional)
    limit: 8.14,
    // '24h' | '7d' | '30d' | '90d' | 'total' | Time period for profit calculation (optional)
    period: period_example,
  } satisfies KinguinProfitControllerGetProductProfitabilityRequest;

  try {
    const data = await api.kinguinProfitControllerGetProductProfitability(body);
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
| **limit** | `number` | Maximum number of products to return | [Optional] [Defaults to `20`] |
| **period** | `24h`, `7d`, `30d`, `90d`, `total` | Time period for profit calculation | [Optional] [Defaults to `&#39;30d&#39;`] [Enum: 24h, 7d, 30d, 90d, total] |

### Return type

[**ProductProfitListDto**](ProductProfitListDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Product profitability list |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kinguinProfitControllerGetProfitAlerts

> ProfitAlertsDto kinguinProfitControllerGetProfitAlerts()

Get profit alerts

Returns active profit-related alerts and warnings

### Example

```ts
import {
  Configuration,
  AdminKinguinProfitAnalyticsApi,
} from '';
import type { KinguinProfitControllerGetProfitAlertsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminKinguinProfitAnalyticsApi(config);

  try {
    const data = await api.kinguinProfitControllerGetProfitAlerts();
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

[**ProfitAlertsDto**](ProfitAlertsDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Profit alerts |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kinguinProfitControllerGetProfitTrend

> ProfitTrendDto kinguinProfitControllerGetProfitTrend(days)

Get profit trend

Returns daily profit data for trend visualization

### Example

```ts
import {
  Configuration,
  AdminKinguinProfitAnalyticsApi,
} from '';
import type { KinguinProfitControllerGetProfitTrendRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminKinguinProfitAnalyticsApi(config);

  const body = {
    // number | Number of days for trend data (optional)
    days: 8.14,
  } satisfies KinguinProfitControllerGetProfitTrendRequest;

  try {
    const data = await api.kinguinProfitControllerGetProfitTrend(body);
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
| **days** | `number` | Number of days for trend data | [Optional] [Defaults to `30`] |

### Return type

[**ProfitTrendDto**](ProfitTrendDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Profit trend data |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kinguinProfitControllerGetSummary

> ProfitSummaryDto kinguinProfitControllerGetSummary(period)

Get profit summary

Returns profit metrics (revenue, cost, margin) for the specified period

### Example

```ts
import {
  Configuration,
  AdminKinguinProfitAnalyticsApi,
} from '';
import type { KinguinProfitControllerGetSummaryRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminKinguinProfitAnalyticsApi(config);

  const body = {
    // '24h' | '7d' | '30d' | '90d' | Time period for profit calculation (optional)
    period: period_example,
  } satisfies KinguinProfitControllerGetSummaryRequest;

  try {
    const data = await api.kinguinProfitControllerGetSummary(body);
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
| **period** | `24h`, `7d`, `30d`, `90d` | Time period for profit calculation | [Optional] [Defaults to `undefined`] [Enum: 24h, 7d, 30d, 90d] |

### Return type

[**ProfitSummaryDto**](ProfitSummaryDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Profit summary for the period |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kinguinProfitControllerGetTopProducts

> Array&lt;ProductProfitDto&gt; kinguinProfitControllerGetTopProducts(limit, period)

Get top profitable products

Returns the most profitable products by total profit

### Example

```ts
import {
  Configuration,
  AdminKinguinProfitAnalyticsApi,
} from '';
import type { KinguinProfitControllerGetTopProductsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminKinguinProfitAnalyticsApi(config);

  const body = {
    // number | Maximum number of products to return (default: 10) (optional)
    limit: 8.14,
    // '24h' | '7d' | '30d' | '90d' | 'total' | Time period for calculation (optional)
    period: period_example,
  } satisfies KinguinProfitControllerGetTopProductsRequest;

  try {
    const data = await api.kinguinProfitControllerGetTopProducts(body);
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
| **limit** | `number` | Maximum number of products to return (default: 10) | [Optional] [Defaults to `20`] |
| **period** | `24h`, `7d`, `30d`, `90d`, `total` | Time period for calculation | [Optional] [Defaults to `undefined`] [Enum: 24h, 7d, 30d, 90d, total] |

### Return type

[**Array&lt;ProductProfitDto&gt;**](ProductProfitDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Top profitable products |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

