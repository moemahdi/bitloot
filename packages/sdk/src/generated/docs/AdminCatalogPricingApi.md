# AdminCatalogPricingApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminPricingControllerCreate**](AdminCatalogPricingApi.md#adminpricingcontrollercreate) | **POST** /admin/catalog/rules | Create new pricing rule (admin only) |
| [**adminPricingControllerDelete**](AdminCatalogPricingApi.md#adminpricingcontrollerdelete) | **DELETE** /admin/catalog/rules/{id} | Delete pricing rule (admin only) |
| [**adminPricingControllerGetById**](AdminCatalogPricingApi.md#adminpricingcontrollergetbyid) | **GET** /admin/catalog/rules/{id} | Get pricing rule by ID (admin only) |
| [**adminPricingControllerListAll**](AdminCatalogPricingApi.md#adminpricingcontrollerlistall) | **GET** /admin/catalog/rules | List all pricing rules (admin only) |
| [**adminPricingControllerUpdate**](AdminCatalogPricingApi.md#adminpricingcontrollerupdate) | **PATCH** /admin/catalog/rules/{id} | Update pricing rule (admin only) |



## adminPricingControllerCreate

> AdminPricingRuleResponseDto adminPricingControllerCreate(createPricingRuleDto)

Create new pricing rule (admin only)

### Example

```ts
import {
  Configuration,
  AdminCatalogPricingApi,
} from '';
import type { AdminPricingControllerCreateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogPricingApi(config);

  const body = {
    // CreatePricingRuleDto
    createPricingRuleDto: ...,
  } satisfies AdminPricingControllerCreateRequest;

  try {
    const data = await api.adminPricingControllerCreate(body);
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
| **createPricingRuleDto** | [CreatePricingRuleDto](CreatePricingRuleDto.md) |  | |

### Return type

[**AdminPricingRuleResponseDto**](AdminPricingRuleResponseDto.md)

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


## adminPricingControllerDelete

> adminPricingControllerDelete(id)

Delete pricing rule (admin only)

### Example

```ts
import {
  Configuration,
  AdminCatalogPricingApi,
} from '';
import type { AdminPricingControllerDeleteRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogPricingApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminPricingControllerDeleteRequest;

  try {
    const data = await api.adminPricingControllerDelete(body);
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
| **204** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminPricingControllerGetById

> AdminPricingRuleResponseDto adminPricingControllerGetById(id)

Get pricing rule by ID (admin only)

### Example

```ts
import {
  Configuration,
  AdminCatalogPricingApi,
} from '';
import type { AdminPricingControllerGetByIdRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogPricingApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminPricingControllerGetByIdRequest;

  try {
    const data = await api.adminPricingControllerGetById(body);
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

[**AdminPricingRuleResponseDto**](AdminPricingRuleResponseDto.md)

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


## adminPricingControllerListAll

> AdminPricingRulesListResponseDto adminPricingControllerListAll(productId, ruleType, isActive, page, limit)

List all pricing rules (admin only)

### Example

```ts
import {
  Configuration,
  AdminCatalogPricingApi,
} from '';
import type { AdminPricingControllerListAllRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogPricingApi(config);

  const body = {
    // string
    productId: productId_example,
    // string
    ruleType: ruleType_example,
    // string
    isActive: isActive_example,
    // string
    page: page_example,
    // string
    limit: limit_example,
  } satisfies AdminPricingControllerListAllRequest;

  try {
    const data = await api.adminPricingControllerListAll(body);
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
| **productId** | `string` |  | [Defaults to `undefined`] |
| **ruleType** | `string` |  | [Defaults to `undefined`] |
| **isActive** | `string` |  | [Defaults to `undefined`] |
| **page** | `string` |  | [Defaults to `undefined`] |
| **limit** | `string` |  | [Defaults to `undefined`] |

### Return type

[**AdminPricingRulesListResponseDto**](AdminPricingRulesListResponseDto.md)

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


## adminPricingControllerUpdate

> AdminPricingRuleResponseDto adminPricingControllerUpdate(id, updatePricingRuleDto)

Update pricing rule (admin only)

### Example

```ts
import {
  Configuration,
  AdminCatalogPricingApi,
} from '';
import type { AdminPricingControllerUpdateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminCatalogPricingApi(config);

  const body = {
    // string
    id: id_example,
    // UpdatePricingRuleDto
    updatePricingRuleDto: ...,
  } satisfies AdminPricingControllerUpdateRequest;

  try {
    const data = await api.adminPricingControllerUpdate(body);
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
| **updatePricingRuleDto** | [UpdatePricingRuleDto](UpdatePricingRuleDto.md) |  | |

### Return type

[**AdminPricingRuleResponseDto**](AdminPricingRuleResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

