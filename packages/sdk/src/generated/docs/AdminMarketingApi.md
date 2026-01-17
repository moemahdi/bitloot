# AdminMarketingApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminMarketingControllerActivateFlashDeal**](AdminMarketingApi.md#adminmarketingcontrolleractivateflashdeal) | **POST** /admin/marketing/flash-deals/{id}/activate | Activate flash deal (deactivates others) |
| [**adminMarketingControllerAddProductToBundle**](AdminMarketingApi.md#adminmarketingcontrolleraddproducttobundle) | **POST** /admin/marketing/bundles/{id}/products | Add product to bundle with discount percentage |
| [**adminMarketingControllerAddProductToFlashDeal**](AdminMarketingApi.md#adminmarketingcontrolleraddproducttoflashdeal) | **POST** /admin/marketing/flash-deals/{id}/products | Add product to flash deal |
| [**adminMarketingControllerCreateBundle**](AdminMarketingApi.md#adminmarketingcontrollercreatebundle) | **POST** /admin/marketing/bundles | Create new bundle deal |
| [**adminMarketingControllerCreateFlashDeal**](AdminMarketingApi.md#adminmarketingcontrollercreateflashdeal) | **POST** /admin/marketing/flash-deals | Create new flash deal |
| [**adminMarketingControllerDeleteBundle**](AdminMarketingApi.md#adminmarketingcontrollerdeletebundle) | **DELETE** /admin/marketing/bundles/{id} | Delete bundle |
| [**adminMarketingControllerDeleteFlashDeal**](AdminMarketingApi.md#adminmarketingcontrollerdeleteflashdeal) | **DELETE** /admin/marketing/flash-deals/{id} | Delete flash deal |
| [**adminMarketingControllerGetAllBundles**](AdminMarketingApi.md#adminmarketingcontrollergetallbundles) | **GET** /admin/marketing/bundles | Get all bundle deals |
| [**adminMarketingControllerGetAllFlashDeals**](AdminMarketingApi.md#adminmarketingcontrollergetallflashdeals) | **GET** /admin/marketing/flash-deals | Get all flash deals |
| [**adminMarketingControllerGetBundle**](AdminMarketingApi.md#adminmarketingcontrollergetbundle) | **GET** /admin/marketing/bundles/{id} | Get bundle by ID |
| [**adminMarketingControllerGetFlashDeal**](AdminMarketingApi.md#adminmarketingcontrollergetflashdeal) | **GET** /admin/marketing/flash-deals/{id} | Get flash deal by ID |
| [**adminMarketingControllerRemoveProductFromBundle**](AdminMarketingApi.md#adminmarketingcontrollerremoveproductfrombundle) | **DELETE** /admin/marketing/bundles/{id}/products/{productId} | Remove product from bundle |
| [**adminMarketingControllerRemoveProductFromFlashDeal**](AdminMarketingApi.md#adminmarketingcontrollerremoveproductfromflashdeal) | **DELETE** /admin/marketing/flash-deals/{id}/products/{productId} | Remove product from flash deal |
| [**adminMarketingControllerUpdateBundle**](AdminMarketingApi.md#adminmarketingcontrollerupdatebundle) | **PATCH** /admin/marketing/bundles/{id} | Update bundle |
| [**adminMarketingControllerUpdateBundleProduct**](AdminMarketingApi.md#adminmarketingcontrollerupdatebundleproduct) | **PATCH** /admin/marketing/bundles/{id}/products/{productId} | Update product discount or order in bundle |
| [**adminMarketingControllerUpdateFlashDeal**](AdminMarketingApi.md#adminmarketingcontrollerupdateflashdeal) | **PATCH** /admin/marketing/flash-deals/{id} | Update flash deal |
| [**adminMarketingControllerUpdateFlashDealProduct**](AdminMarketingApi.md#adminmarketingcontrollerupdateflashdealproduct) | **PATCH** /admin/marketing/flash-deals/{id}/products/{productId} | Update product in flash deal |



## adminMarketingControllerActivateFlashDeal

> FlashDealResponseDto adminMarketingControllerActivateFlashDeal(id)

Activate flash deal (deactivates others)

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerActivateFlashDealRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminMarketingControllerActivateFlashDealRequest;

  try {
    const data = await api.adminMarketingControllerActivateFlashDeal(body);
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

[**FlashDealResponseDto**](FlashDealResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Activated flash deal |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminMarketingControllerAddProductToBundle

> BundleDealResponseDto adminMarketingControllerAddProductToBundle(id, addBundleProductDto)

Add product to bundle with discount percentage

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerAddProductToBundleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  const body = {
    // string
    id: id_example,
    // AddBundleProductDto
    addBundleProductDto: ...,
  } satisfies AdminMarketingControllerAddProductToBundleRequest;

  try {
    const data = await api.adminMarketingControllerAddProductToBundle(body);
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
| **addBundleProductDto** | [AddBundleProductDto](AddBundleProductDto.md) |  | |

### Return type

[**BundleDealResponseDto**](BundleDealResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Product added |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminMarketingControllerAddProductToFlashDeal

> FlashDealResponseDto adminMarketingControllerAddProductToFlashDeal(id, addFlashDealProductDto)

Add product to flash deal

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerAddProductToFlashDealRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  const body = {
    // string
    id: id_example,
    // AddFlashDealProductDto
    addFlashDealProductDto: ...,
  } satisfies AdminMarketingControllerAddProductToFlashDealRequest;

  try {
    const data = await api.adminMarketingControllerAddProductToFlashDeal(body);
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
| **addFlashDealProductDto** | [AddFlashDealProductDto](AddFlashDealProductDto.md) |  | |

### Return type

[**FlashDealResponseDto**](FlashDealResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Product added |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminMarketingControllerCreateBundle

> BundleDealResponseDto adminMarketingControllerCreateBundle(createBundleDealDto)

Create new bundle deal

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerCreateBundleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  const body = {
    // CreateBundleDealDto
    createBundleDealDto: ...,
  } satisfies AdminMarketingControllerCreateBundleRequest;

  try {
    const data = await api.adminMarketingControllerCreateBundle(body);
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
| **createBundleDealDto** | [CreateBundleDealDto](CreateBundleDealDto.md) |  | |

### Return type

[**BundleDealResponseDto**](BundleDealResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Created bundle |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminMarketingControllerCreateFlashDeal

> FlashDealResponseDto adminMarketingControllerCreateFlashDeal(createFlashDealDto)

Create new flash deal

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerCreateFlashDealRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  const body = {
    // CreateFlashDealDto
    createFlashDealDto: ...,
  } satisfies AdminMarketingControllerCreateFlashDealRequest;

  try {
    const data = await api.adminMarketingControllerCreateFlashDeal(body);
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
| **createFlashDealDto** | [CreateFlashDealDto](CreateFlashDealDto.md) |  | |

### Return type

[**FlashDealResponseDto**](FlashDealResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Created flash deal |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminMarketingControllerDeleteBundle

> adminMarketingControllerDeleteBundle(id)

Delete bundle

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerDeleteBundleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminMarketingControllerDeleteBundleRequest;

  try {
    const data = await api.adminMarketingControllerDeleteBundle(body);
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
| **204** | Bundle deleted |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminMarketingControllerDeleteFlashDeal

> adminMarketingControllerDeleteFlashDeal(id)

Delete flash deal

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerDeleteFlashDealRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminMarketingControllerDeleteFlashDealRequest;

  try {
    const data = await api.adminMarketingControllerDeleteFlashDeal(body);
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
| **204** | Flash deal deleted |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminMarketingControllerGetAllBundles

> Array&lt;BundleDealResponseDto&gt; adminMarketingControllerGetAllBundles()

Get all bundle deals

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerGetAllBundlesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  try {
    const data = await api.adminMarketingControllerGetAllBundles();
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

[**Array&lt;BundleDealResponseDto&gt;**](BundleDealResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of bundles |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminMarketingControllerGetAllFlashDeals

> Array&lt;FlashDealResponseDto&gt; adminMarketingControllerGetAllFlashDeals()

Get all flash deals

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerGetAllFlashDealsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  try {
    const data = await api.adminMarketingControllerGetAllFlashDeals();
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

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of flash deals |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminMarketingControllerGetBundle

> BundleDealResponseDto adminMarketingControllerGetBundle(id)

Get bundle by ID

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerGetBundleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminMarketingControllerGetBundleRequest;

  try {
    const data = await api.adminMarketingControllerGetBundle(body);
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

[**BundleDealResponseDto**](BundleDealResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Bundle details |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminMarketingControllerGetFlashDeal

> FlashDealResponseDto adminMarketingControllerGetFlashDeal(id)

Get flash deal by ID

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerGetFlashDealRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminMarketingControllerGetFlashDealRequest;

  try {
    const data = await api.adminMarketingControllerGetFlashDeal(body);
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

[**FlashDealResponseDto**](FlashDealResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Flash deal details |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminMarketingControllerRemoveProductFromBundle

> BundleDealResponseDto adminMarketingControllerRemoveProductFromBundle(id, productId)

Remove product from bundle

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerRemoveProductFromBundleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  const body = {
    // string
    id: id_example,
    // string
    productId: productId_example,
  } satisfies AdminMarketingControllerRemoveProductFromBundleRequest;

  try {
    const data = await api.adminMarketingControllerRemoveProductFromBundle(body);
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
| **productId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**BundleDealResponseDto**](BundleDealResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Product removed |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminMarketingControllerRemoveProductFromFlashDeal

> FlashDealResponseDto adminMarketingControllerRemoveProductFromFlashDeal(id, productId)

Remove product from flash deal

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerRemoveProductFromFlashDealRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  const body = {
    // string
    id: id_example,
    // string
    productId: productId_example,
  } satisfies AdminMarketingControllerRemoveProductFromFlashDealRequest;

  try {
    const data = await api.adminMarketingControllerRemoveProductFromFlashDeal(body);
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
| **productId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**FlashDealResponseDto**](FlashDealResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Product removed |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminMarketingControllerUpdateBundle

> BundleDealResponseDto adminMarketingControllerUpdateBundle(id, updateBundleDealDto)

Update bundle

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerUpdateBundleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  const body = {
    // string
    id: id_example,
    // UpdateBundleDealDto
    updateBundleDealDto: ...,
  } satisfies AdminMarketingControllerUpdateBundleRequest;

  try {
    const data = await api.adminMarketingControllerUpdateBundle(body);
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
| **updateBundleDealDto** | [UpdateBundleDealDto](UpdateBundleDealDto.md) |  | |

### Return type

[**BundleDealResponseDto**](BundleDealResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Updated bundle |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminMarketingControllerUpdateBundleProduct

> BundleDealResponseDto adminMarketingControllerUpdateBundleProduct(id, productId, updateBundleProductDto)

Update product discount or order in bundle

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerUpdateBundleProductRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  const body = {
    // string
    id: id_example,
    // string
    productId: productId_example,
    // UpdateBundleProductDto
    updateBundleProductDto: ...,
  } satisfies AdminMarketingControllerUpdateBundleProductRequest;

  try {
    const data = await api.adminMarketingControllerUpdateBundleProduct(body);
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
| **productId** | `string` |  | [Defaults to `undefined`] |
| **updateBundleProductDto** | [UpdateBundleProductDto](UpdateBundleProductDto.md) |  | |

### Return type

[**BundleDealResponseDto**](BundleDealResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Product updated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminMarketingControllerUpdateFlashDeal

> FlashDealResponseDto adminMarketingControllerUpdateFlashDeal(id, updateFlashDealDto)

Update flash deal

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerUpdateFlashDealRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  const body = {
    // string
    id: id_example,
    // UpdateFlashDealDto
    updateFlashDealDto: ...,
  } satisfies AdminMarketingControllerUpdateFlashDealRequest;

  try {
    const data = await api.adminMarketingControllerUpdateFlashDeal(body);
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
| **updateFlashDealDto** | [UpdateFlashDealDto](UpdateFlashDealDto.md) |  | |

### Return type

[**FlashDealResponseDto**](FlashDealResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Updated flash deal |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminMarketingControllerUpdateFlashDealProduct

> FlashDealResponseDto adminMarketingControllerUpdateFlashDealProduct(id, productId, updateFlashDealProductDto)

Update product in flash deal

### Example

```ts
import {
  Configuration,
  AdminMarketingApi,
} from '';
import type { AdminMarketingControllerUpdateFlashDealProductRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminMarketingApi(config);

  const body = {
    // string
    id: id_example,
    // string
    productId: productId_example,
    // UpdateFlashDealProductDto
    updateFlashDealProductDto: ...,
  } satisfies AdminMarketingControllerUpdateFlashDealProductRequest;

  try {
    const data = await api.adminMarketingControllerUpdateFlashDealProduct(body);
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
| **productId** | `string` |  | [Defaults to `undefined`] |
| **updateFlashDealProductDto** | [UpdateFlashDealProductDto](UpdateFlashDealProductDto.md) |  | |

### Return type

[**FlashDealResponseDto**](FlashDealResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Product updated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

