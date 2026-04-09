# AdminCreditsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminCreditsControllerAdjustCredits**](AdminCreditsApi.md#admincreditscontrolleradjustcredits) | **POST** /admin/credits/adjust | Admin adjust (add/deduct) credits for a user |
| [**adminCreditsControllerConfirmTopup**](AdminCreditsApi.md#admincreditscontrollerconfirmtopup) | **POST** /admin/credits/topups/{id}/confirm | Manually confirm a pending topup (for IPN recovery) |
| [**adminCreditsControllerGetPendingTopups**](AdminCreditsApi.md#admincreditscontrollergetpendingtopups) | **GET** /admin/credits/topups/pending | Get all pending credit topups |
| [**adminCreditsControllerGetStats**](AdminCreditsApi.md#admincreditscontrollergetstats) | **GET** /admin/credits/stats | Get system-wide credits statistics |
| [**adminCreditsControllerGetUserBalances**](AdminCreditsApi.md#admincreditscontrollergetuserbalances) | **GET** /admin/credits/users | Get paginated user credit balances |
| [**adminCreditsControllerGetUserCredits**](AdminCreditsApi.md#admincreditscontrollergetusercredits) | **GET** /admin/credits/users/{userId} | Get single user credit details |
| [**adminCreditsControllerGrantCredits**](AdminCreditsApi.md#admincreditscontrollergrantcredits) | **POST** /admin/credits/grant | Grant promo credits to a user |



## adminCreditsControllerAdjustCredits

> SuccessResponseDto adminCreditsControllerAdjustCredits(adminAdjustCreditsDto)

Admin adjust (add/deduct) credits for a user

### Example

```ts
import {
  Configuration,
  AdminCreditsApi,
} from '';
import type { AdminCreditsControllerAdjustCreditsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCreditsApi(config);

  const body = {
    // AdminAdjustCreditsDto
    adminAdjustCreditsDto: ...,
  } satisfies AdminCreditsControllerAdjustCreditsRequest;

  try {
    const data = await api.adminCreditsControllerAdjustCredits(body);
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
| **adminAdjustCreditsDto** | [AdminAdjustCreditsDto](AdminAdjustCreditsDto.md) |  | |

### Return type

[**SuccessResponseDto**](SuccessResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminCreditsControllerConfirmTopup

> SuccessResponseDto adminCreditsControllerConfirmTopup(id)

Manually confirm a pending topup (for IPN recovery)

### Example

```ts
import {
  Configuration,
  AdminCreditsApi,
} from '';
import type { AdminCreditsControllerConfirmTopupRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCreditsApi(config);

  const body = {
    // string | Topup ID
    id: id_example,
  } satisfies AdminCreditsControllerConfirmTopupRequest;

  try {
    const data = await api.adminCreditsControllerConfirmTopup(body);
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
| **id** | `string` | Topup ID | [Defaults to `undefined`] |

### Return type

[**SuccessResponseDto**](SuccessResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminCreditsControllerGetPendingTopups

> AdminPendingTopupsResultDto adminCreditsControllerGetPendingTopups()

Get all pending credit topups

### Example

```ts
import {
  Configuration,
  AdminCreditsApi,
} from '';
import type { AdminCreditsControllerGetPendingTopupsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCreditsApi(config);

  try {
    const data = await api.adminCreditsControllerGetPendingTopups();
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

[**AdminPendingTopupsResultDto**](AdminPendingTopupsResultDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminCreditsControllerGetStats

> AdminCreditsStatsDto adminCreditsControllerGetStats()

Get system-wide credits statistics

### Example

```ts
import {
  Configuration,
  AdminCreditsApi,
} from '';
import type { AdminCreditsControllerGetStatsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCreditsApi(config);

  try {
    const data = await api.adminCreditsControllerGetStats();
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

[**AdminCreditsStatsDto**](AdminCreditsStatsDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminCreditsControllerGetUserBalances

> AdminUserBalancesResultDto adminCreditsControllerGetUserBalances(page, limit, email, sortBy)

Get paginated user credit balances

### Example

```ts
import {
  Configuration,
  AdminCreditsApi,
} from '';
import type { AdminCreditsControllerGetUserBalancesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCreditsApi(config);

  const body = {
    // number | Page number (optional)
    page: 8.14,
    // number | Items per page (optional)
    limit: 8.14,
    // string | Search by email (optional)
    email: email_example,
    // 'balance' | 'createdAt' | Sort by field (optional)
    sortBy: sortBy_example,
  } satisfies AdminCreditsControllerGetUserBalancesRequest;

  try {
    const data = await api.adminCreditsControllerGetUserBalances(body);
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
| **page** | `number` | Page number | [Optional] [Defaults to `1`] |
| **limit** | `number` | Items per page | [Optional] [Defaults to `20`] |
| **email** | `string` | Search by email | [Optional] [Defaults to `undefined`] |
| **sortBy** | `balance`, `createdAt` | Sort by field | [Optional] [Defaults to `undefined`] [Enum: balance, createdAt] |

### Return type

[**AdminUserBalancesResultDto**](AdminUserBalancesResultDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminCreditsControllerGetUserCredits

> AdminUserCreditsDetailDto adminCreditsControllerGetUserCredits(userId)

Get single user credit details

### Example

```ts
import {
  Configuration,
  AdminCreditsApi,
} from '';
import type { AdminCreditsControllerGetUserCreditsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCreditsApi(config);

  const body = {
    // string
    userId: userId_example,
  } satisfies AdminCreditsControllerGetUserCreditsRequest;

  try {
    const data = await api.adminCreditsControllerGetUserCredits(body);
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
| **userId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**AdminUserCreditsDetailDto**](AdminUserCreditsDetailDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminCreditsControllerGrantCredits

> SuccessResponseDto adminCreditsControllerGrantCredits(adminGrantCreditsDto)

Grant promo credits to a user

### Example

```ts
import {
  Configuration,
  AdminCreditsApi,
} from '';
import type { AdminCreditsControllerGrantCreditsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCreditsApi(config);

  const body = {
    // AdminGrantCreditsDto
    adminGrantCreditsDto: ...,
  } satisfies AdminCreditsControllerGrantCreditsRequest;

  try {
    const data = await api.adminCreditsControllerGrantCredits(body);
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
| **adminGrantCreditsDto** | [AdminGrantCreditsDto](AdminGrantCreditsDto.md) |  | |

### Return type

[**SuccessResponseDto**](SuccessResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

