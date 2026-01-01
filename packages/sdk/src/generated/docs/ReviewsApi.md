# ReviewsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**reviewsControllerCanReviewOrder**](ReviewsApi.md#reviewscontrollercanrevieworder) | **GET** /reviews/can-review/{orderId} | Check if user can review an order |
| [**reviewsControllerCreateReview**](ReviewsApi.md#reviewscontrollercreatereview) | **POST** /reviews | Submit a review for an order |
| [**reviewsControllerDeleteOwnReview**](ReviewsApi.md#reviewscontrollerdeleteownreview) | **DELETE** /reviews/{id} | Delete own review |
| [**reviewsControllerGetHomepageReviews**](ReviewsApi.md#reviewscontrollergethomepagereviews) | **GET** /reviews/homepage | Get homepage reviews (featured, approved) |
| [**reviewsControllerGetMyReviews**](ReviewsApi.md#reviewscontrollergetmyreviews) | **GET** /reviews/my | Get current user\&#39;s reviews |
| [**reviewsControllerGetPublicReviews**](ReviewsApi.md#reviewscontrollergetpublicreviews) | **GET** /reviews | Get approved reviews (public) |
| [**reviewsControllerUpdateOwnReview**](ReviewsApi.md#reviewscontrollerupdateownreview) | **PUT** /reviews/{id} | Update own review (only while pending) |



## reviewsControllerCanReviewOrder

> ReviewsControllerCanReviewOrder200Response reviewsControllerCanReviewOrder(orderId)

Check if user can review an order

### Example

```ts
import {
  Configuration,
  ReviewsApi,
} from '';
import type { ReviewsControllerCanReviewOrderRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new ReviewsApi(config);

  const body = {
    // string
    orderId: orderId_example,
  } satisfies ReviewsControllerCanReviewOrderRequest;

  try {
    const data = await api.reviewsControllerCanReviewOrder(body);
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
| **orderId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**ReviewsControllerCanReviewOrder200Response**](ReviewsControllerCanReviewOrder200Response.md)

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


## reviewsControllerCreateReview

> ReviewResponseDto reviewsControllerCreateReview(createReviewDto)

Submit a review for an order

### Example

```ts
import {
  Configuration,
  ReviewsApi,
} from '';
import type { ReviewsControllerCreateReviewRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new ReviewsApi(config);

  const body = {
    // CreateReviewDto
    createReviewDto: ...,
  } satisfies ReviewsControllerCreateReviewRequest;

  try {
    const data = await api.reviewsControllerCreateReview(body);
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
| **createReviewDto** | [CreateReviewDto](CreateReviewDto.md) |  | |

### Return type

[**ReviewResponseDto**](ReviewResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |
| **400** | Invalid request or order not eligible for review |  -  |
| **404** | Order not found |  -  |
| **409** | Review already exists for this order |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## reviewsControllerDeleteOwnReview

> reviewsControllerDeleteOwnReview(id)

Delete own review

### Example

```ts
import {
  Configuration,
  ReviewsApi,
} from '';
import type { ReviewsControllerDeleteOwnReviewRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new ReviewsApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies ReviewsControllerDeleteOwnReviewRequest;

  try {
    const data = await api.reviewsControllerDeleteOwnReview(body);
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
| **204** | Review deleted |  -  |
| **403** | Cannot delete another user\&#39;s review |  -  |
| **404** | Review not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## reviewsControllerGetHomepageReviews

> Array&lt;ReviewResponseDto&gt; reviewsControllerGetHomepageReviews(limit)

Get homepage reviews (featured, approved)

### Example

```ts
import {
  Configuration,
  ReviewsApi,
} from '';
import type { ReviewsControllerGetHomepageReviewsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ReviewsApi();

  const body = {
    // number | Number of reviews (default: 6, max: 12) (optional)
    limit: 8.14,
  } satisfies ReviewsControllerGetHomepageReviewsRequest;

  try {
    const data = await api.reviewsControllerGetHomepageReviews(body);
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
| **limit** | `number` | Number of reviews (default: 6, max: 12) | [Optional] [Defaults to `undefined`] |

### Return type

[**Array&lt;ReviewResponseDto&gt;**](ReviewResponseDto.md)

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


## reviewsControllerGetMyReviews

> PaginatedReviewsDto reviewsControllerGetMyReviews(limit, page)

Get current user\&#39;s reviews

### Example

```ts
import {
  Configuration,
  ReviewsApi,
} from '';
import type { ReviewsControllerGetMyReviewsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new ReviewsApi(config);

  const body = {
    // number (optional)
    limit: 8.14,
    // number (optional)
    page: 8.14,
  } satisfies ReviewsControllerGetMyReviewsRequest;

  try {
    const data = await api.reviewsControllerGetMyReviews(body);
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
| **limit** | `number` |  | [Optional] [Defaults to `undefined`] |
| **page** | `number` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedReviewsDto**](PaginatedReviewsDto.md)

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


## reviewsControllerGetPublicReviews

> PaginatedReviewsDto reviewsControllerGetPublicReviews(productId, limit, page)

Get approved reviews (public)

### Example

```ts
import {
  Configuration,
  ReviewsApi,
} from '';
import type { ReviewsControllerGetPublicReviewsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ReviewsApi();

  const body = {
    // string | Filter by product ID (optional)
    productId: productId_example,
    // number | Items per page (default: 10, max: 50) (optional)
    limit: 8.14,
    // number | Page number (default: 1) (optional)
    page: 8.14,
  } satisfies ReviewsControllerGetPublicReviewsRequest;

  try {
    const data = await api.reviewsControllerGetPublicReviews(body);
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
| **productId** | `string` | Filter by product ID | [Optional] [Defaults to `undefined`] |
| **limit** | `number` | Items per page (default: 10, max: 50) | [Optional] [Defaults to `undefined`] |
| **page** | `number` | Page number (default: 1) | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedReviewsDto**](PaginatedReviewsDto.md)

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


## reviewsControllerUpdateOwnReview

> ReviewResponseDto reviewsControllerUpdateOwnReview(id, updateReviewDto)

Update own review (only while pending)

### Example

```ts
import {
  Configuration,
  ReviewsApi,
} from '';
import type { ReviewsControllerUpdateOwnReviewRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new ReviewsApi(config);

  const body = {
    // string
    id: id_example,
    // UpdateReviewDto
    updateReviewDto: ...,
  } satisfies ReviewsControllerUpdateOwnReviewRequest;

  try {
    const data = await api.reviewsControllerUpdateOwnReview(body);
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
| **updateReviewDto** | [UpdateReviewDto](UpdateReviewDto.md) |  | |

### Return type

[**ReviewResponseDto**](ReviewResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **400** | Cannot edit after moderation |  -  |
| **403** | Cannot edit another user\&#39;s review |  -  |
| **404** | Review not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

