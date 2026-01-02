# WatchlistApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**watchlistControllerAddToWatchlist**](WatchlistApi.md#watchlistcontrolleraddtowatchlist) | **POST** /watchlist | Add a product to watchlist |
| [**watchlistControllerCheckWatchlist**](WatchlistApi.md#watchlistcontrollercheckwatchlist) | **GET** /watchlist/check/{productId} | Check if a product is in watchlist |
| [**watchlistControllerGetWatchlist**](WatchlistApi.md#watchlistcontrollergetwatchlist) | **GET** /watchlist | Get current user\&#39;s watchlist |
| [**watchlistControllerGetWatchlistCount**](WatchlistApi.md#watchlistcontrollergetwatchlistcount) | **GET** /watchlist/count | Get total number of items in watchlist |
| [**watchlistControllerRemoveFromWatchlist**](WatchlistApi.md#watchlistcontrollerremovefromwatchlist) | **DELETE** /watchlist/{productId} | Remove a product from watchlist |



## watchlistControllerAddToWatchlist

> WatchlistItemResponseDto watchlistControllerAddToWatchlist(addToWatchlistDto)

Add a product to watchlist

### Example

```ts
import {
  Configuration,
  WatchlistApi,
} from '';
import type { WatchlistControllerAddToWatchlistRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WatchlistApi(config);

  const body = {
    // AddToWatchlistDto
    addToWatchlistDto: ...,
  } satisfies WatchlistControllerAddToWatchlistRequest;

  try {
    const data = await api.watchlistControllerAddToWatchlist(body);
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
| **addToWatchlistDto** | [AddToWatchlistDto](AddToWatchlistDto.md) |  | |

### Return type

[**WatchlistItemResponseDto**](WatchlistItemResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Product added to watchlist successfully |  -  |
| **404** | Product not found |  -  |
| **409** | Product already in watchlist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## watchlistControllerCheckWatchlist

> CheckWatchlistResponseDto watchlistControllerCheckWatchlist(productId)

Check if a product is in watchlist

### Example

```ts
import {
  Configuration,
  WatchlistApi,
} from '';
import type { WatchlistControllerCheckWatchlistRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WatchlistApi(config);

  const body = {
    // string | Product ID to check
    productId: productId_example,
  } satisfies WatchlistControllerCheckWatchlistRequest;

  try {
    const data = await api.watchlistControllerCheckWatchlist(body);
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
| **productId** | `string` | Product ID to check | [Defaults to `undefined`] |

### Return type

[**CheckWatchlistResponseDto**](CheckWatchlistResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Returns whether product is in watchlist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## watchlistControllerGetWatchlist

> PaginatedWatchlistResponseDto watchlistControllerGetWatchlist(page, limit)

Get current user\&#39;s watchlist

### Example

```ts
import {
  Configuration,
  WatchlistApi,
} from '';
import type { WatchlistControllerGetWatchlistRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WatchlistApi(config);

  const body = {
    // number | Page number (1-based) (optional)
    page: 1,
    // number | Number of items per page (max 50) (optional)
    limit: 10,
  } satisfies WatchlistControllerGetWatchlistRequest;

  try {
    const data = await api.watchlistControllerGetWatchlist(body);
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
| **page** | `number` | Page number (1-based) | [Optional] [Defaults to `1`] |
| **limit** | `number` | Number of items per page (max 50) | [Optional] [Defaults to `10`] |

### Return type

[**PaginatedWatchlistResponseDto**](PaginatedWatchlistResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Returns paginated watchlist items |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## watchlistControllerGetWatchlistCount

> WatchlistControllerGetWatchlistCount200Response watchlistControllerGetWatchlistCount()

Get total number of items in watchlist

### Example

```ts
import {
  Configuration,
  WatchlistApi,
} from '';
import type { WatchlistControllerGetWatchlistCountRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WatchlistApi(config);

  try {
    const data = await api.watchlistControllerGetWatchlistCount();
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

[**WatchlistControllerGetWatchlistCount200Response**](WatchlistControllerGetWatchlistCount200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Returns watchlist count |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## watchlistControllerRemoveFromWatchlist

> watchlistControllerRemoveFromWatchlist(productId)

Remove a product from watchlist

### Example

```ts
import {
  Configuration,
  WatchlistApi,
} from '';
import type { WatchlistControllerRemoveFromWatchlistRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WatchlistApi(config);

  const body = {
    // string | Product ID to remove from watchlist
    productId: productId_example,
  } satisfies WatchlistControllerRemoveFromWatchlistRequest;

  try {
    const data = await api.watchlistControllerRemoveFromWatchlist(body);
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
| **productId** | `string` | Product ID to remove from watchlist | [Defaults to `undefined`] |

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
| **204** | Product removed from watchlist successfully |  -  |
| **404** | Item not found in watchlist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

