# AdminPromosApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminPromosControllerCreate**](AdminPromosApi.md#adminpromoscontrollercreate) | **POST** /admin/promos | Create a new promo code (admin) |
| [**adminPromosControllerDelete**](AdminPromosApi.md#adminpromoscontrollerdelete) | **DELETE** /admin/promos/{id} | Delete a promo code (admin, permanent) |
| [**adminPromosControllerGetOne**](AdminPromosApi.md#adminpromoscontrollergetone) | **GET** /admin/promos/{id} | Get promo code by ID (admin) |
| [**adminPromosControllerGetRedemptions**](AdminPromosApi.md#adminpromoscontrollergetredemptions) | **GET** /admin/promos/{id}/redemptions | Get redemption history for a promo code (admin) |
| [**adminPromosControllerList**](AdminPromosApi.md#adminpromoscontrollerlist) | **GET** /admin/promos | List all promo codes (admin) |
| [**adminPromosControllerUpdate**](AdminPromosApi.md#adminpromoscontrollerupdate) | **PATCH** /admin/promos/{id} | Update a promo code (admin) |



## adminPromosControllerCreate

> PromoCodeResponseDto adminPromosControllerCreate(createPromoCodeDto)

Create a new promo code (admin)

### Example

```ts
import {
  Configuration,
  AdminPromosApi,
} from '';
import type { AdminPromosControllerCreateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminPromosApi(config);

  const body = {
    // CreatePromoCodeDto
    createPromoCodeDto: ...,
  } satisfies AdminPromosControllerCreateRequest;

  try {
    const data = await api.adminPromosControllerCreate(body);
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
| **createPromoCodeDto** | [CreatePromoCodeDto](CreatePromoCodeDto.md) |  | |

### Return type

[**PromoCodeResponseDto**](PromoCodeResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |
| **409** | Promo code already exists |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminPromosControllerDelete

> adminPromosControllerDelete(id)

Delete a promo code (admin, permanent)

### Example

```ts
import {
  Configuration,
  AdminPromosApi,
} from '';
import type { AdminPromosControllerDeleteRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminPromosApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminPromosControllerDeleteRequest;

  try {
    const data = await api.adminPromosControllerDelete(body);
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
| **204** | Promo code deleted |  -  |
| **404** | Promo code not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminPromosControllerGetOne

> PromoCodeResponseDto adminPromosControllerGetOne(id)

Get promo code by ID (admin)

### Example

```ts
import {
  Configuration,
  AdminPromosApi,
} from '';
import type { AdminPromosControllerGetOneRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminPromosApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminPromosControllerGetOneRequest;

  try {
    const data = await api.adminPromosControllerGetOne(body);
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

[**PromoCodeResponseDto**](PromoCodeResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | Promo code not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminPromosControllerGetRedemptions

> PaginatedRedemptionsDto adminPromosControllerGetRedemptions(id, page, limit)

Get redemption history for a promo code (admin)

### Example

```ts
import {
  Configuration,
  AdminPromosApi,
} from '';
import type { AdminPromosControllerGetRedemptionsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminPromosApi(config);

  const body = {
    // string
    id: id_example,
    // number (optional)
    page: 8.14,
    // number (optional)
    limit: 8.14,
  } satisfies AdminPromosControllerGetRedemptionsRequest;

  try {
    const data = await api.adminPromosControllerGetRedemptions(body);
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
| **page** | `number` |  | [Optional] [Defaults to `1`] |
| **limit** | `number` |  | [Optional] [Defaults to `20`] |

### Return type

[**PaginatedRedemptionsDto**](PaginatedRedemptionsDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | Promo code not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminPromosControllerList

> PaginatedPromoCodesDto adminPromosControllerList(page, limit, isActive, search, scopeType)

List all promo codes (admin)

### Example

```ts
import {
  Configuration,
  AdminPromosApi,
} from '';
import type { AdminPromosControllerListRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminPromosApi(config);

  const body = {
    // number (optional)
    page: 8.14,
    // number (optional)
    limit: 8.14,
    // boolean | Filter by active status (optional)
    isActive: true,
    // string | Search by code (optional)
    search: search_example,
    // 'global' | 'category' | 'product' (optional)
    scopeType: scopeType_example,
  } satisfies AdminPromosControllerListRequest;

  try {
    const data = await api.adminPromosControllerList(body);
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
| **page** | `number` |  | [Optional] [Defaults to `1`] |
| **limit** | `number` |  | [Optional] [Defaults to `20`] |
| **isActive** | `boolean` | Filter by active status | [Optional] [Defaults to `undefined`] |
| **search** | `string` | Search by code | [Optional] [Defaults to `undefined`] |
| **scopeType** | `global`, `category`, `product` |  | [Optional] [Defaults to `undefined`] [Enum: global, category, product] |

### Return type

[**PaginatedPromoCodesDto**](PaginatedPromoCodesDto.md)

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


## adminPromosControllerUpdate

> PromoCodeResponseDto adminPromosControllerUpdate(id, updatePromoCodeDto)

Update a promo code (admin)

### Example

```ts
import {
  Configuration,
  AdminPromosApi,
} from '';
import type { AdminPromosControllerUpdateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminPromosApi(config);

  const body = {
    // string
    id: id_example,
    // UpdatePromoCodeDto
    updatePromoCodeDto: ...,
  } satisfies AdminPromosControllerUpdateRequest;

  try {
    const data = await api.adminPromosControllerUpdate(body);
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
| **updatePromoCodeDto** | [UpdatePromoCodeDto](UpdatePromoCodeDto.md) |  | |

### Return type

[**PromoCodeResponseDto**](PromoCodeResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | Promo code not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

