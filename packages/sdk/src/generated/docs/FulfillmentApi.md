# FulfillmentApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**fulfillmentControllerGetDownloadLink**](FulfillmentApi.md#fulfillmentcontrollergetdownloadlink) | **GET** /fulfillment/{id}/download-link | Generate delivery link for fulfilled order (requires ownership) |
| [**fulfillmentControllerGetStatus**](FulfillmentApi.md#fulfillmentcontrollergetstatus) | **GET** /fulfillment/{id}/status | Get order fulfillment status (requires ownership) |
| [**fulfillmentControllerHealthCheck**](FulfillmentApi.md#fulfillmentcontrollerhealthcheck) | **GET** /fulfillment/health/check | Health check for fulfillment service |
| [**fulfillmentControllerRecoverOrder**](FulfillmentApi.md#fulfillmentcontrollerrecoverorder) | **POST** /fulfillment/{id}/recover | Recover signed URLs for orders with keys in R2 (requires ownership) |
| [**fulfillmentControllerRevealKey**](FulfillmentApi.md#fulfillmentcontrollerrevealkey) | **POST** /fulfillment/{id}/reveal-key/{itemId} | Admin: Reveal encrypted key (requires admin role) |
| [**fulfillmentControllerRevealMyKey**](FulfillmentApi.md#fulfillmentcontrollerrevealmykey) | **POST** /fulfillment/{id}/reveal/{itemId} | Reveal encrypted key (requires ownership) |



## fulfillmentControllerGetDownloadLink

> DeliveryLinkDto fulfillmentControllerGetDownloadLink(id)

Generate delivery link for fulfilled order (requires ownership)

### Example

```ts
import {
  Configuration,
  FulfillmentApi,
} from '';
import type { FulfillmentControllerGetDownloadLinkRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new FulfillmentApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies FulfillmentControllerGetDownloadLinkRequest;

  try {
    const data = await api.fulfillmentControllerGetDownloadLink(body);
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

[**DeliveryLinkDto**](DeliveryLinkDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **400** | Order not fulfilled |  -  |
| **401** | Unauthorized - missing or invalid JWT |  -  |
| **403** | Forbidden - order does not belong to user |  -  |
| **404** | Order not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## fulfillmentControllerGetStatus

> FulfillmentStatusDto fulfillmentControllerGetStatus(id)

Get order fulfillment status (requires ownership)

### Example

```ts
import {
  Configuration,
  FulfillmentApi,
} from '';
import type { FulfillmentControllerGetStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new FulfillmentApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies FulfillmentControllerGetStatusRequest;

  try {
    const data = await api.fulfillmentControllerGetStatus(body);
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

[**FulfillmentStatusDto**](FulfillmentStatusDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **401** | Unauthorized - missing or invalid JWT |  -  |
| **403** | Forbidden - order does not belong to user |  -  |
| **404** | Order not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## fulfillmentControllerHealthCheck

> HealthCheckResultDto fulfillmentControllerHealthCheck()

Health check for fulfillment service

### Example

```ts
import {
  Configuration,
  FulfillmentApi,
} from '';
import type { FulfillmentControllerHealthCheckRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new FulfillmentApi();

  try {
    const data = await api.fulfillmentControllerHealthCheck();
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

[**HealthCheckResultDto**](HealthCheckResultDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## fulfillmentControllerRecoverOrder

> fulfillmentControllerRecoverOrder(id)

Recover signed URLs for orders with keys in R2 (requires ownership)

### Example

```ts
import {
  Configuration,
  FulfillmentApi,
} from '';
import type { FulfillmentControllerRecoverOrderRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new FulfillmentApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies FulfillmentControllerRecoverOrderRequest;

  try {
    const data = await api.fulfillmentControllerRecoverOrder(body);
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
| **200** | Recovery result with updated items |  -  |
| **401** | Unauthorized - missing or invalid JWT |  -  |
| **403** | Forbidden - order does not belong to user |  -  |
| **404** | Order not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## fulfillmentControllerRevealKey

> RevealedKeyDto fulfillmentControllerRevealKey(id, itemId)

Admin: Reveal encrypted key (requires admin role)

### Example

```ts
import {
  Configuration,
  FulfillmentApi,
} from '';
import type { FulfillmentControllerRevealKeyRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new FulfillmentApi(config);

  const body = {
    // string
    id: id_example,
    // string
    itemId: itemId_example,
  } satisfies FulfillmentControllerRevealKeyRequest;

  try {
    const data = await api.fulfillmentControllerRevealKey(body);
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
| **itemId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**RevealedKeyDto**](RevealedKeyDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **400** | Order not fulfilled or key unavailable |  -  |
| **401** | Unauthorized - not admin |  -  |
| **404** | Order or item not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## fulfillmentControllerRevealMyKey

> RevealedKeyDto fulfillmentControllerRevealMyKey(id, itemId)

Reveal encrypted key (requires ownership)

### Example

```ts
import {
  Configuration,
  FulfillmentApi,
} from '';
import type { FulfillmentControllerRevealMyKeyRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new FulfillmentApi(config);

  const body = {
    // string
    id: id_example,
    // string
    itemId: itemId_example,
  } satisfies FulfillmentControllerRevealMyKeyRequest;

  try {
    const data = await api.fulfillmentControllerRevealMyKey(body);
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
| **itemId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**RevealedKeyDto**](RevealedKeyDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **401** | Unauthorized |  -  |
| **403** | Forbidden |  -  |
| **404** | Order or item not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

