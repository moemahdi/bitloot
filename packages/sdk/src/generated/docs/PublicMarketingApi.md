# PublicMarketingApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**publicMarketingControllerGetActiveBundles**](PublicMarketingApi.md#publicmarketingcontrollergetactivebundles) | **GET** /public/marketing/bundles | Get active bundles |
| [**publicMarketingControllerGetActiveFlashDeal**](PublicMarketingApi.md#publicmarketingcontrollergetactiveflashdeal) | **GET** /public/marketing/flash-deal/active | Get currently active flash deal by type |
| [**publicMarketingControllerGetActiveFlashDeals**](PublicMarketingApi.md#publicmarketingcontrollergetactiveflashdeals) | **GET** /public/marketing/flash-deals/active | Get all currently active flash deals |
| [**publicMarketingControllerGetBundleBySlug**](PublicMarketingApi.md#publicmarketingcontrollergetbundlebyslug) | **GET** /public/marketing/bundles/{slug} | Get bundle by slug |
| [**publicMarketingControllerGetEffectivePrice**](PublicMarketingApi.md#publicmarketingcontrollergeteffectiveprice) | **GET** /public/marketing/effective-price/{productId} | Get effective price for a single product |
| [**publicMarketingControllerGetEffectivePrices**](PublicMarketingApi.md#publicmarketingcontrollergeteffectiveprices) | **POST** /public/marketing/effective-prices | Get effective prices for products (with flash deal discounts applied) |



## publicMarketingControllerGetActiveBundles

> Array&lt;BundleDealResponseDto&gt; publicMarketingControllerGetActiveBundles(limit)

Get active bundles

### Example

```ts
import {
  Configuration,
  PublicMarketingApi,
} from '';
import type { PublicMarketingControllerGetActiveBundlesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PublicMarketingApi();

  const body = {
    // string | Maximum bundles to return (optional)
    limit: 6,
  } satisfies PublicMarketingControllerGetActiveBundlesRequest;

  try {
    const data = await api.publicMarketingControllerGetActiveBundles(body);
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
| **limit** | `string` | Maximum bundles to return | [Optional] [Defaults to `undefined`] |

### Return type

[**Array&lt;BundleDealResponseDto&gt;**](BundleDealResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of active bundles |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## publicMarketingControllerGetActiveFlashDeal

> FlashDealResponseDto publicMarketingControllerGetActiveFlashDeal(type)

Get currently active flash deal by type

### Example

```ts
import {
  Configuration,
  PublicMarketingApi,
} from '';
import type { PublicMarketingControllerGetActiveFlashDealRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PublicMarketingApi();

  const body = {
    // 'inline' | 'sticky' | Display type filter (inline or sticky) (optional)
    type: type_example,
  } satisfies PublicMarketingControllerGetActiveFlashDealRequest;

  try {
    const data = await api.publicMarketingControllerGetActiveFlashDeal(body);
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
| **type** | `inline`, `sticky` | Display type filter (inline or sticky) | [Optional] [Defaults to `undefined`] [Enum: inline, sticky] |

### Return type

[**FlashDealResponseDto**](FlashDealResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Active flash deal or null |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## publicMarketingControllerGetActiveFlashDeals

> Array&lt;FlashDealResponseDto&gt; publicMarketingControllerGetActiveFlashDeals()

Get all currently active flash deals

### Example

```ts
import {
  Configuration,
  PublicMarketingApi,
} from '';
import type { PublicMarketingControllerGetActiveFlashDealsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PublicMarketingApi();

  try {
    const data = await api.publicMarketingControllerGetActiveFlashDeals();
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

[**Array&lt;FlashDealResponseDto&gt;**](FlashDealResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of active flash deals |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## publicMarketingControllerGetBundleBySlug

> BundleDealResponseDto publicMarketingControllerGetBundleBySlug(slug)

Get bundle by slug

### Example

```ts
import {
  Configuration,
  PublicMarketingApi,
} from '';
import type { PublicMarketingControllerGetBundleBySlugRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PublicMarketingApi();

  const body = {
    // string
    slug: slug_example,
  } satisfies PublicMarketingControllerGetBundleBySlugRequest;

  try {
    const data = await api.publicMarketingControllerGetBundleBySlug(body);
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
| **slug** | `string` |  | [Defaults to `undefined`] |

### Return type

[**BundleDealResponseDto**](BundleDealResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Bundle details |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## publicMarketingControllerGetEffectivePrice

> EffectivePriceResponseDto publicMarketingControllerGetEffectivePrice(productId, price, currency)

Get effective price for a single product

Returns the actual price a customer will pay, considering any active flash deals.

### Example

```ts
import {
  Configuration,
  PublicMarketingApi,
} from '';
import type { PublicMarketingControllerGetEffectivePriceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PublicMarketingApi();

  const body = {
    // string
    productId: productId_example,
    // string | Base price of product
    price: price_example,
    // string | Currency code (optional)
    currency: EUR,
  } satisfies PublicMarketingControllerGetEffectivePriceRequest;

  try {
    const data = await api.publicMarketingControllerGetEffectivePrice(body);
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
| **price** | `string` | Base price of product | [Defaults to `undefined`] |
| **currency** | `string` | Currency code | [Optional] [Defaults to `undefined`] |

### Return type

[**EffectivePriceResponseDto**](EffectivePriceResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Effective price for product |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## publicMarketingControllerGetEffectivePrices

> GetEffectivePricesResponseDto publicMarketingControllerGetEffectivePrices(getEffectivePricesRequestDto)

Get effective prices for products (with flash deal discounts applied)

Returns the actual price customers will pay, considering any active flash deals. Use this for cart, checkout, and display.

### Example

```ts
import {
  Configuration,
  PublicMarketingApi,
} from '';
import type { PublicMarketingControllerGetEffectivePricesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PublicMarketingApi();

  const body = {
    // GetEffectivePricesRequestDto
    getEffectivePricesRequestDto: ...,
  } satisfies PublicMarketingControllerGetEffectivePricesRequest;

  try {
    const data = await api.publicMarketingControllerGetEffectivePrices(body);
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
| **getEffectivePricesRequestDto** | [GetEffectivePricesRequestDto](GetEffectivePricesRequestDto.md) |  | |

### Return type

[**GetEffectivePricesResponseDto**](GetEffectivePricesResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Effective prices for requested products |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

