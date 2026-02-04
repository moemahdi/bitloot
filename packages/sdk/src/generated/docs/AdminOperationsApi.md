# AdminOperationsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminOpsControllerClearFailedJobs**](AdminOperationsApi.md#adminopscontrollerclearfailedjobs) | **POST** /admin/ops/queues/{name}/failed/clear | Clear all failed jobs from a queue |
| [**adminOpsControllerCreateFeatureFlag**](AdminOperationsApi.md#adminopscontrollercreatefeatureflag) | **POST** /admin/ops/feature-flags | Create new feature flag |
| [**adminOpsControllerGetBalance**](AdminOperationsApi.md#adminopscontrollergetbalance) | **GET** /admin/ops/balance | Get current balance and account status |
| [**adminOpsControllerGetBalanceDetails**](AdminOperationsApi.md#adminopscontrollergetbalancedetails) | **GET** /admin/ops/balance/details | Get detailed balance by currency |
| [**adminOpsControllerGetCacheStats**](AdminOperationsApi.md#adminopscontrollergetcachestats) | **GET** /admin/ops/cache/stats | Get catalog cache statistics |
| [**adminOpsControllerGetFailedJobs**](AdminOperationsApi.md#adminopscontrollergetfailedjobs) | **GET** /admin/ops/queues/{name}/failed | Get failed jobs with error details |
| [**adminOpsControllerGetFeatureFlag**](AdminOperationsApi.md#adminopscontrollergetfeatureflag) | **GET** /admin/ops/feature-flags/{name} | Get single feature flag |
| [**adminOpsControllerGetFeatureFlags**](AdminOperationsApi.md#adminopscontrollergetfeatureflags) | **GET** /admin/ops/feature-flags | Get all feature flags |
| [**adminOpsControllerGetQueueDetails**](AdminOperationsApi.md#adminopscontrollergetqueuedetails) | **GET** /admin/ops/queues/{name}/details | Get detailed queue information |
| [**adminOpsControllerGetQueueStats**](AdminOperationsApi.md#adminopscontrollergetqueuestats) | **GET** /admin/ops/queues/stats | Get BullMQ queue statistics |
| [**adminOpsControllerGetSystemHealth**](AdminOperationsApi.md#adminopscontrollergetsystemhealth) | **GET** /admin/ops/health | Get system health status |
| [**adminOpsControllerInvalidateAllCache**](AdminOperationsApi.md#adminopscontrollerinvalidateallcache) | **DELETE** /admin/ops/cache | Invalidate all catalog caches |
| [**adminOpsControllerInvalidateCategoriesCache**](AdminOperationsApi.md#adminopscontrollerinvalidatecategoriescache) | **DELETE** /admin/ops/cache/categories | Invalidate categories and filters cache |
| [**adminOpsControllerInvalidateFeaturedCache**](AdminOperationsApi.md#adminopscontrollerinvalidatefeaturedcache) | **DELETE** /admin/ops/cache/featured | Invalidate featured products cache |
| [**adminOpsControllerRetryFailedJob**](AdminOperationsApi.md#adminopscontrollerretryfailedjob) | **POST** /admin/ops/queues/{name}/failed/{jobId}/retry | Retry a specific failed job |
| [**adminOpsControllerTriggerUserDeletionCleanup**](AdminOperationsApi.md#adminopscontrollertriggeruserdeletioncleanup) | **POST** /admin/ops/user-deletion-cleanup | Manually trigger user deletion cleanup (30-day grace period expired) |
| [**adminOpsControllerUpdateFeatureFlag**](AdminOperationsApi.md#adminopscontrollerupdatefeatureflag) | **PATCH** /admin/ops/feature-flags/{name} | Update feature flag |



## adminOpsControllerClearFailedJobs

> adminOpsControllerClearFailedJobs(name)

Clear all failed jobs from a queue

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerClearFailedJobsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  const body = {
    // string
    name: name_example,
  } satisfies AdminOpsControllerClearFailedJobsRequest;

  try {
    const data = await api.adminOpsControllerClearFailedJobs(body);
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
| **name** | `string` |  | [Defaults to `undefined`] |

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
| **200** | Failed jobs cleared |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminOpsControllerCreateFeatureFlag

> AdminOpsControllerCreateFeatureFlag201Response adminOpsControllerCreateFeatureFlag()

Create new feature flag

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerCreateFeatureFlagRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  try {
    const data = await api.adminOpsControllerCreateFeatureFlag();
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

[**AdminOpsControllerCreateFeatureFlag201Response**](AdminOpsControllerCreateFeatureFlag201Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Feature flag created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminOpsControllerGetBalance

> AdminOpsControllerGetBalance200Response adminOpsControllerGetBalance()

Get current balance and account status

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerGetBalanceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  try {
    const data = await api.adminOpsControllerGetBalance();
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

[**AdminOpsControllerGetBalance200Response**](AdminOpsControllerGetBalance200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Current balance from payment provider |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminOpsControllerGetBalanceDetails

> AdminOpsControllerGetBalanceDetails200Response adminOpsControllerGetBalanceDetails()

Get detailed balance by currency

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerGetBalanceDetailsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  try {
    const data = await api.adminOpsControllerGetBalanceDetails();
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

[**AdminOpsControllerGetBalanceDetails200Response**](AdminOpsControllerGetBalanceDetails200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Detailed balance information |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminOpsControllerGetCacheStats

> AdminOpsControllerGetCacheStats200Response adminOpsControllerGetCacheStats()

Get catalog cache statistics

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerGetCacheStatsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  try {
    const data = await api.adminOpsControllerGetCacheStats();
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

[**AdminOpsControllerGetCacheStats200Response**](AdminOpsControllerGetCacheStats200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Cache statistics |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminOpsControllerGetFailedJobs

> AdminOpsControllerGetFailedJobs200Response adminOpsControllerGetFailedJobs(name, limit, offset)

Get failed jobs with error details

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerGetFailedJobsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  const body = {
    // string
    name: name_example,
    // number (optional)
    limit: 20,
    // number (optional)
    offset: 0,
  } satisfies AdminOpsControllerGetFailedJobsRequest;

  try {
    const data = await api.adminOpsControllerGetFailedJobs(body);
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
| **name** | `string` |  | [Defaults to `undefined`] |
| **limit** | `number` |  | [Optional] [Defaults to `undefined`] |
| **offset** | `number` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**AdminOpsControllerGetFailedJobs200Response**](AdminOpsControllerGetFailedJobs200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Failed jobs with error information |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminOpsControllerGetFeatureFlag

> AdminOpsControllerGetFeatureFlag200Response adminOpsControllerGetFeatureFlag(name)

Get single feature flag

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerGetFeatureFlagRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  const body = {
    // string
    name: name_example,
  } satisfies AdminOpsControllerGetFeatureFlagRequest;

  try {
    const data = await api.adminOpsControllerGetFeatureFlag(body);
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
| **name** | `string` |  | [Defaults to `undefined`] |

### Return type

[**AdminOpsControllerGetFeatureFlag200Response**](AdminOpsControllerGetFeatureFlag200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Feature flag status |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminOpsControllerGetFeatureFlags

> Array&lt;AdminOpsControllerGetFeatureFlags200ResponseInner&gt; adminOpsControllerGetFeatureFlags()

Get all feature flags

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerGetFeatureFlagsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  try {
    const data = await api.adminOpsControllerGetFeatureFlags();
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

[**Array&lt;AdminOpsControllerGetFeatureFlags200ResponseInner&gt;**](AdminOpsControllerGetFeatureFlags200ResponseInner.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of all feature flags with status |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminOpsControllerGetQueueDetails

> AdminOpsControllerGetQueueDetails200Response adminOpsControllerGetQueueDetails(name)

Get detailed queue information

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerGetQueueDetailsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  const body = {
    // string
    name: name_example,
  } satisfies AdminOpsControllerGetQueueDetailsRequest;

  try {
    const data = await api.adminOpsControllerGetQueueDetails(body);
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
| **name** | `string` |  | [Defaults to `undefined`] |

### Return type

[**AdminOpsControllerGetQueueDetails200Response**](AdminOpsControllerGetQueueDetails200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Queue details including recent jobs |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminOpsControllerGetQueueStats

> { [key: string]: AdminOpsControllerGetQueueStats200ResponseValue; } adminOpsControllerGetQueueStats()

Get BullMQ queue statistics

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerGetQueueStatsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  try {
    const data = await api.adminOpsControllerGetQueueStats();
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

[**{ [key: string]: AdminOpsControllerGetQueueStats200ResponseValue; }**](AdminOpsControllerGetQueueStats200ResponseValue.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Queue statistics (waiting, active, failed, completed) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminOpsControllerGetSystemHealth

> AdminOpsControllerGetSystemHealth200Response adminOpsControllerGetSystemHealth()

Get system health status

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerGetSystemHealthRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  try {
    const data = await api.adminOpsControllerGetSystemHealth();
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

[**AdminOpsControllerGetSystemHealth200Response**](AdminOpsControllerGetSystemHealth200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | System health check results |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminOpsControllerInvalidateAllCache

> AdminOpsControllerInvalidateAllCache200Response adminOpsControllerInvalidateAllCache()

Invalidate all catalog caches

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerInvalidateAllCacheRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  try {
    const data = await api.adminOpsControllerInvalidateAllCache();
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

[**AdminOpsControllerInvalidateAllCache200Response**](AdminOpsControllerInvalidateAllCache200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Cache invalidation result |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminOpsControllerInvalidateCategoriesCache

> AdminOpsControllerInvalidateFeaturedCache200Response adminOpsControllerInvalidateCategoriesCache()

Invalidate categories and filters cache

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerInvalidateCategoriesCacheRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  try {
    const data = await api.adminOpsControllerInvalidateCategoriesCache();
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

[**AdminOpsControllerInvalidateFeaturedCache200Response**](AdminOpsControllerInvalidateFeaturedCache200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Cache invalidation result |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminOpsControllerInvalidateFeaturedCache

> AdminOpsControllerInvalidateFeaturedCache200Response adminOpsControllerInvalidateFeaturedCache()

Invalidate featured products cache

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerInvalidateFeaturedCacheRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  try {
    const data = await api.adminOpsControllerInvalidateFeaturedCache();
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

[**AdminOpsControllerInvalidateFeaturedCache200Response**](AdminOpsControllerInvalidateFeaturedCache200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Cache invalidation result |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminOpsControllerRetryFailedJob

> adminOpsControllerRetryFailedJob(name, jobId)

Retry a specific failed job

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerRetryFailedJobRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  const body = {
    // string
    name: name_example,
    // string
    jobId: jobId_example,
  } satisfies AdminOpsControllerRetryFailedJobRequest;

  try {
    const data = await api.adminOpsControllerRetryFailedJob(body);
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
| **name** | `string` |  | [Defaults to `undefined`] |
| **jobId** | `string` |  | [Defaults to `undefined`] |

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
| **200** | Job retried successfully |  -  |
| **404** | Job not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminOpsControllerTriggerUserDeletionCleanup

> AdminOpsControllerTriggerUserDeletionCleanup200Response adminOpsControllerTriggerUserDeletionCleanup()

Manually trigger user deletion cleanup (30-day grace period expired)

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerTriggerUserDeletionCleanupRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  try {
    const data = await api.adminOpsControllerTriggerUserDeletionCleanup();
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

[**AdminOpsControllerTriggerUserDeletionCleanup200Response**](AdminOpsControllerTriggerUserDeletionCleanup200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Cleanup results |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminOpsControllerUpdateFeatureFlag

> AdminOpsControllerCreateFeatureFlag201Response adminOpsControllerUpdateFeatureFlag(name)

Update feature flag

### Example

```ts
import {
  Configuration,
  AdminOperationsApi,
} from '';
import type { AdminOpsControllerUpdateFeatureFlagRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminOperationsApi(config);

  const body = {
    // string
    name: name_example,
  } satisfies AdminOpsControllerUpdateFeatureFlagRequest;

  try {
    const data = await api.adminOpsControllerUpdateFeatureFlag(body);
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
| **name** | `string` |  | [Defaults to `undefined`] |

### Return type

[**AdminOpsControllerCreateFeatureFlag201Response**](AdminOpsControllerCreateFeatureFlag201Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Feature flag updated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

