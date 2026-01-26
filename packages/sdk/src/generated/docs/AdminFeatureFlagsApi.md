# AdminFeatureFlagsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**featureFlagsControllerCheckFlags**](AdminFeatureFlagsApi.md#featureflagscontrollercheckflags) | **POST** /admin/feature-flags/check | Check multiple feature flags at once |
| [**featureFlagsControllerCreate**](AdminFeatureFlagsApi.md#featureflagscontrollercreate) | **POST** /admin/feature-flags | Create a new feature flag |
| [**featureFlagsControllerDelete**](AdminFeatureFlagsApi.md#featureflagscontrollerdelete) | **DELETE** /admin/feature-flags/{name} | Delete a feature flag |
| [**featureFlagsControllerFindAll**](AdminFeatureFlagsApi.md#featureflagscontrollerfindall) | **GET** /admin/feature-flags | Get all feature flags |
| [**featureFlagsControllerFindAllGrouped**](AdminFeatureFlagsApi.md#featureflagscontrollerfindallgrouped) | **GET** /admin/feature-flags/grouped | Get feature flags grouped by category |
| [**featureFlagsControllerFindByName**](AdminFeatureFlagsApi.md#featureflagscontrollerfindbyname) | **GET** /admin/feature-flags/{name} | Get a single feature flag by name |
| [**featureFlagsControllerToggle**](AdminFeatureFlagsApi.md#featureflagscontrollertoggle) | **PATCH** /admin/feature-flags/{name}/toggle | Toggle a feature flag (enable/disable) |
| [**featureFlagsControllerUpdate**](AdminFeatureFlagsApi.md#featureflagscontrollerupdate) | **PATCH** /admin/feature-flags/{name} | Update a feature flag |



## featureFlagsControllerCheckFlags

> { [key: string]: boolean; } featureFlagsControllerCheckFlags()

Check multiple feature flags at once

### Example

```ts
import {
  Configuration,
  AdminFeatureFlagsApi,
} from '';
import type { FeatureFlagsControllerCheckFlagsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminFeatureFlagsApi(config);

  try {
    const data = await api.featureFlagsControllerCheckFlags();
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

**{ [key: string]: boolean; }**

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Map of flag names to enabled status |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## featureFlagsControllerCreate

> FeatureFlagResponseDto featureFlagsControllerCreate(createFeatureFlagDto)

Create a new feature flag

### Example

```ts
import {
  Configuration,
  AdminFeatureFlagsApi,
} from '';
import type { FeatureFlagsControllerCreateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminFeatureFlagsApi(config);

  const body = {
    // CreateFeatureFlagDto
    createFeatureFlagDto: ...,
  } satisfies FeatureFlagsControllerCreateRequest;

  try {
    const data = await api.featureFlagsControllerCreate(body);
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
| **createFeatureFlagDto** | [CreateFeatureFlagDto](CreateFeatureFlagDto.md) |  | |

### Return type

[**FeatureFlagResponseDto**](FeatureFlagResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Feature flag created |  -  |
| **409** | Flag already exists |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## featureFlagsControllerDelete

> featureFlagsControllerDelete(name)

Delete a feature flag

### Example

```ts
import {
  Configuration,
  AdminFeatureFlagsApi,
} from '';
import type { FeatureFlagsControllerDeleteRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminFeatureFlagsApi(config);

  const body = {
    // string | Flag name (snake_case)
    name: name_example,
  } satisfies FeatureFlagsControllerDeleteRequest;

  try {
    const data = await api.featureFlagsControllerDelete(body);
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
| **name** | `string` | Flag name (snake_case) | [Defaults to `undefined`] |

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
| **200** | Feature flag deleted |  -  |
| **404** | Flag not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## featureFlagsControllerFindAll

> ListFeatureFlagsResponseDto featureFlagsControllerFindAll()

Get all feature flags

### Example

```ts
import {
  Configuration,
  AdminFeatureFlagsApi,
} from '';
import type { FeatureFlagsControllerFindAllRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminFeatureFlagsApi(config);

  try {
    const data = await api.featureFlagsControllerFindAll();
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

[**ListFeatureFlagsResponseDto**](ListFeatureFlagsResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of all feature flags with counts |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## featureFlagsControllerFindAllGrouped

> GroupedFeatureFlagsResponseDto featureFlagsControllerFindAllGrouped()

Get feature flags grouped by category

### Example

```ts
import {
  Configuration,
  AdminFeatureFlagsApi,
} from '';
import type { FeatureFlagsControllerFindAllGroupedRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminFeatureFlagsApi(config);

  try {
    const data = await api.featureFlagsControllerFindAllGrouped();
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

[**GroupedFeatureFlagsResponseDto**](GroupedFeatureFlagsResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Flags grouped by category |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## featureFlagsControllerFindByName

> FeatureFlagResponseDto featureFlagsControllerFindByName(name)

Get a single feature flag by name

### Example

```ts
import {
  Configuration,
  AdminFeatureFlagsApi,
} from '';
import type { FeatureFlagsControllerFindByNameRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminFeatureFlagsApi(config);

  const body = {
    // string | Flag name (snake_case)
    name: name_example,
  } satisfies FeatureFlagsControllerFindByNameRequest;

  try {
    const data = await api.featureFlagsControllerFindByName(body);
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
| **name** | `string` | Flag name (snake_case) | [Defaults to `undefined`] |

### Return type

[**FeatureFlagResponseDto**](FeatureFlagResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Feature flag details |  -  |
| **404** | Flag not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## featureFlagsControllerToggle

> ToggleFeatureFlagResponseDto featureFlagsControllerToggle(name)

Toggle a feature flag (enable/disable)

### Example

```ts
import {
  Configuration,
  AdminFeatureFlagsApi,
} from '';
import type { FeatureFlagsControllerToggleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminFeatureFlagsApi(config);

  const body = {
    // string | Flag name (snake_case)
    name: name_example,
  } satisfies FeatureFlagsControllerToggleRequest;

  try {
    const data = await api.featureFlagsControllerToggle(body);
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
| **name** | `string` | Flag name (snake_case) | [Defaults to `undefined`] |

### Return type

[**ToggleFeatureFlagResponseDto**](ToggleFeatureFlagResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Feature flag toggled |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## featureFlagsControllerUpdate

> FeatureFlagResponseDto featureFlagsControllerUpdate(name, updateFeatureFlagDto)

Update a feature flag

### Example

```ts
import {
  Configuration,
  AdminFeatureFlagsApi,
} from '';
import type { FeatureFlagsControllerUpdateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminFeatureFlagsApi(config);

  const body = {
    // string | Flag name (snake_case)
    name: name_example,
    // UpdateFeatureFlagDto
    updateFeatureFlagDto: ...,
  } satisfies FeatureFlagsControllerUpdateRequest;

  try {
    const data = await api.featureFlagsControllerUpdate(body);
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
| **name** | `string` | Flag name (snake_case) | [Defaults to `undefined`] |
| **updateFeatureFlagDto** | [UpdateFeatureFlagDto](UpdateFeatureFlagDto.md) |  | |

### Return type

[**FeatureFlagResponseDto**](FeatureFlagResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Feature flag updated |  -  |
| **404** | Flag not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

