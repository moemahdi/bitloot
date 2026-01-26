# AdminSystemConfigurationApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**systemConfigControllerCreate**](AdminSystemConfigurationApi.md#systemconfigcontrollercreate) | **POST** /admin/config | Create a new configuration entry |
| [**systemConfigControllerDelete**](AdminSystemConfigurationApi.md#systemconfigcontrollerdelete) | **DELETE** /admin/config/{id} | Delete a configuration entry |
| [**systemConfigControllerFindAll**](AdminSystemConfigurationApi.md#systemconfigcontrollerfindall) | **GET** /admin/config | Get all system configurations grouped by provider |
| [**systemConfigControllerFindById**](AdminSystemConfigurationApi.md#systemconfigcontrollerfindbyid) | **GET** /admin/config/{id} | Get a single configuration by ID |
| [**systemConfigControllerFindByProvider**](AdminSystemConfigurationApi.md#systemconfigcontrollerfindbyprovider) | **GET** /admin/config/provider/{provider} | Get configurations for a specific provider |
| [**systemConfigControllerGetCurrentEnvironment**](AdminSystemConfigurationApi.md#systemconfigcontrollergetcurrentenvironment) | **GET** /admin/config/environment/current | Get current active environment |
| [**systemConfigControllerSwitchEnvironment**](AdminSystemConfigurationApi.md#systemconfigcontrollerswitchenvironment) | **POST** /admin/config/environment | Switch active environment (sandbox/production) |
| [**systemConfigControllerTestAllConfigs**](AdminSystemConfigurationApi.md#systemconfigcontrollertestallconfigs) | **POST** /admin/config/test-all | Test all provider configurations |
| [**systemConfigControllerTestConfig**](AdminSystemConfigurationApi.md#systemconfigcontrollertestconfig) | **POST** /admin/config/test/{provider} | Test a provider configuration |
| [**systemConfigControllerUpdate**](AdminSystemConfigurationApi.md#systemconfigcontrollerupdate) | **PATCH** /admin/config/{id} | Update a configuration entry |



## systemConfigControllerCreate

> SystemConfigResponseDto systemConfigControllerCreate(createSystemConfigDto)

Create a new configuration entry

### Example

```ts
import {
  Configuration,
  AdminSystemConfigurationApi,
} from '';
import type { SystemConfigControllerCreateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminSystemConfigurationApi(config);

  const body = {
    // CreateSystemConfigDto
    createSystemConfigDto: ...,
  } satisfies SystemConfigControllerCreateRequest;

  try {
    const data = await api.systemConfigControllerCreate(body);
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
| **createSystemConfigDto** | [CreateSystemConfigDto](CreateSystemConfigDto.md) |  | |

### Return type

[**SystemConfigResponseDto**](SystemConfigResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Configuration created |  -  |
| **409** | Config already exists |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## systemConfigControllerDelete

> systemConfigControllerDelete(id)

Delete a configuration entry

### Example

```ts
import {
  Configuration,
  AdminSystemConfigurationApi,
} from '';
import type { SystemConfigControllerDeleteRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminSystemConfigurationApi(config);

  const body = {
    // string | Configuration UUID
    id: id_example,
  } satisfies SystemConfigControllerDeleteRequest;

  try {
    const data = await api.systemConfigControllerDelete(body);
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
| **id** | `string` | Configuration UUID | [Defaults to `undefined`] |

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
| **200** | Configuration deleted |  -  |
| **404** | Config not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## systemConfigControllerFindAll

> ListSystemConfigsResponseDto systemConfigControllerFindAll()

Get all system configurations grouped by provider

### Example

```ts
import {
  Configuration,
  AdminSystemConfigurationApi,
} from '';
import type { SystemConfigControllerFindAllRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminSystemConfigurationApi(config);

  try {
    const data = await api.systemConfigControllerFindAll();
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

[**ListSystemConfigsResponseDto**](ListSystemConfigsResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | All configurations grouped by provider |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## systemConfigControllerFindById

> SystemConfigResponseDto systemConfigControllerFindById(id)

Get a single configuration by ID

### Example

```ts
import {
  Configuration,
  AdminSystemConfigurationApi,
} from '';
import type { SystemConfigControllerFindByIdRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminSystemConfigurationApi(config);

  const body = {
    // string | Configuration UUID
    id: id_example,
  } satisfies SystemConfigControllerFindByIdRequest;

  try {
    const data = await api.systemConfigControllerFindById(body);
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
| **id** | `string` | Configuration UUID | [Defaults to `undefined`] |

### Return type

[**SystemConfigResponseDto**](SystemConfigResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Configuration details (secrets are masked) |  -  |
| **404** | Config not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## systemConfigControllerFindByProvider

> ProviderConfigResponseDto systemConfigControllerFindByProvider(provider)

Get configurations for a specific provider

### Example

```ts
import {
  Configuration,
  AdminSystemConfigurationApi,
} from '';
import type { SystemConfigControllerFindByProviderRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminSystemConfigurationApi(config);

  const body = {
    // string | Provider name (e.g., nowpayments, kinguin)
    provider: provider_example,
  } satisfies SystemConfigControllerFindByProviderRequest;

  try {
    const data = await api.systemConfigControllerFindByProvider(body);
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
| **provider** | `string` | Provider name (e.g., nowpayments, kinguin) | [Defaults to `undefined`] |

### Return type

[**ProviderConfigResponseDto**](ProviderConfigResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Provider configuration with sandbox and production settings |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## systemConfigControllerGetCurrentEnvironment

> SystemConfigControllerGetCurrentEnvironment200Response systemConfigControllerGetCurrentEnvironment()

Get current active environment

### Example

```ts
import {
  Configuration,
  AdminSystemConfigurationApi,
} from '';
import type { SystemConfigControllerGetCurrentEnvironmentRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminSystemConfigurationApi(config);

  try {
    const data = await api.systemConfigControllerGetCurrentEnvironment();
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

[**SystemConfigControllerGetCurrentEnvironment200Response**](SystemConfigControllerGetCurrentEnvironment200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Current environment |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## systemConfigControllerSwitchEnvironment

> SwitchEnvironmentResponseDto systemConfigControllerSwitchEnvironment(switchEnvironmentDto)

Switch active environment (sandbox/production)

### Example

```ts
import {
  Configuration,
  AdminSystemConfigurationApi,
} from '';
import type { SystemConfigControllerSwitchEnvironmentRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminSystemConfigurationApi(config);

  const body = {
    // SwitchEnvironmentDto
    switchEnvironmentDto: ...,
  } satisfies SystemConfigControllerSwitchEnvironmentRequest;

  try {
    const data = await api.systemConfigControllerSwitchEnvironment(body);
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
| **switchEnvironmentDto** | [SwitchEnvironmentDto](SwitchEnvironmentDto.md) |  | |

### Return type

[**SwitchEnvironmentResponseDto**](SwitchEnvironmentResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Environment switched |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## systemConfigControllerTestAllConfigs

> Array&lt;TestConfigResponseDto&gt; systemConfigControllerTestAllConfigs()

Test all provider configurations

### Example

```ts
import {
  Configuration,
  AdminSystemConfigurationApi,
} from '';
import type { SystemConfigControllerTestAllConfigsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminSystemConfigurationApi(config);

  try {
    const data = await api.systemConfigControllerTestAllConfigs();
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

[**Array&lt;TestConfigResponseDto&gt;**](TestConfigResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Test results for all providers |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## systemConfigControllerTestConfig

> TestConfigResponseDto systemConfigControllerTestConfig(provider)

Test a provider configuration

### Example

```ts
import {
  Configuration,
  AdminSystemConfigurationApi,
} from '';
import type { SystemConfigControllerTestConfigRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminSystemConfigurationApi(config);

  const body = {
    // string | Provider to test (e.g., nowpayments, kinguin)
    provider: provider_example,
  } satisfies SystemConfigControllerTestConfigRequest;

  try {
    const data = await api.systemConfigControllerTestConfig(body);
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
| **provider** | `string` | Provider to test (e.g., nowpayments, kinguin) | [Defaults to `undefined`] |

### Return type

[**TestConfigResponseDto**](TestConfigResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Test result |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## systemConfigControllerUpdate

> SystemConfigResponseDto systemConfigControllerUpdate(id, updateSystemConfigDto)

Update a configuration entry

### Example

```ts
import {
  Configuration,
  AdminSystemConfigurationApi,
} from '';
import type { SystemConfigControllerUpdateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminSystemConfigurationApi(config);

  const body = {
    // string | Configuration UUID
    id: id_example,
    // UpdateSystemConfigDto
    updateSystemConfigDto: ...,
  } satisfies SystemConfigControllerUpdateRequest;

  try {
    const data = await api.systemConfigControllerUpdate(body);
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
| **id** | `string` | Configuration UUID | [Defaults to `undefined`] |
| **updateSystemConfigDto** | [UpdateSystemConfigDto](UpdateSystemConfigDto.md) |  | |

### Return type

[**SystemConfigResponseDto**](SystemConfigResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Configuration updated |  -  |
| **404** | Config not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

