# AdminReviewsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminReviewsControllerBulkApprove**](AdminReviewsApi.md#adminreviewscontrollerbulkapprove) | **POST** /admin/reviews/bulk-approve | Bulk approve reviews |
| [**adminReviewsControllerBulkDelete**](AdminReviewsApi.md#adminreviewscontrollerbulkdelete) | **POST** /admin/reviews/bulk-delete | Bulk delete reviews |
| [**adminReviewsControllerBulkReject**](AdminReviewsApi.md#adminreviewscontrollerbulkreject) | **POST** /admin/reviews/bulk-reject | Bulk reject reviews |
| [**adminReviewsControllerCreateReview**](AdminReviewsApi.md#adminreviewscontrollercreatereview) | **POST** /admin/reviews | Create a review (admin) |
| [**adminReviewsControllerDeleteReview**](AdminReviewsApi.md#adminreviewscontrollerdeletereview) | **DELETE** /admin/reviews/{id} | Delete review (admin) |
| [**adminReviewsControllerGetReview**](AdminReviewsApi.md#adminreviewscontrollergetreview) | **GET** /admin/reviews/{id} | Get review by ID (admin) |
| [**adminReviewsControllerGetReviews**](AdminReviewsApi.md#adminreviewscontrollergetreviews) | **GET** /admin/reviews | List all reviews with filters (admin) |
| [**adminReviewsControllerGetStats**](AdminReviewsApi.md#adminreviewscontrollergetstats) | **GET** /admin/reviews/stats | Get review statistics (admin) |
| [**adminReviewsControllerModerateReview**](AdminReviewsApi.md#adminreviewscontrollermoderatereview) | **PUT** /admin/reviews/{id}/moderate | Moderate review (approve/reject) |
| [**adminReviewsControllerToggleHomepageDisplay**](AdminReviewsApi.md#adminreviewscontrollertogglehomepagedisplay) | **PUT** /admin/reviews/{id}/toggle-homepage | Toggle homepage display for review |
| [**adminReviewsControllerUpdateReview**](AdminReviewsApi.md#adminreviewscontrollerupdatereview) | **PUT** /admin/reviews/{id} | Update review (admin) |



## adminReviewsControllerBulkApprove

> AdminReviewsControllerBulkApprove200Response adminReviewsControllerBulkApprove()

Bulk approve reviews

### Example

```ts
import {
  Configuration,
  AdminReviewsApi,
} from '';
import type { AdminReviewsControllerBulkApproveRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminReviewsApi(config);

  try {
    const data = await api.adminReviewsControllerBulkApprove();
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

[**AdminReviewsControllerBulkApprove200Response**](AdminReviewsControllerBulkApprove200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Reviews approved |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminReviewsControllerBulkDelete

> AdminReviewsControllerBulkApprove200Response adminReviewsControllerBulkDelete()

Bulk delete reviews

### Example

```ts
import {
  Configuration,
  AdminReviewsApi,
} from '';
import type { AdminReviewsControllerBulkDeleteRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminReviewsApi(config);

  try {
    const data = await api.adminReviewsControllerBulkDelete();
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

[**AdminReviewsControllerBulkApprove200Response**](AdminReviewsControllerBulkApprove200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Reviews deleted |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminReviewsControllerBulkReject

> AdminReviewsControllerBulkApprove200Response adminReviewsControllerBulkReject()

Bulk reject reviews

### Example

```ts
import {
  Configuration,
  AdminReviewsApi,
} from '';
import type { AdminReviewsControllerBulkRejectRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminReviewsApi(config);

  try {
    const data = await api.adminReviewsControllerBulkReject();
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

[**AdminReviewsControllerBulkApprove200Response**](AdminReviewsControllerBulkApprove200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Reviews rejected |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminReviewsControllerCreateReview

> AdminReviewResponseDto adminReviewsControllerCreateReview(adminCreateReviewDto)

Create a review (admin)

### Example

```ts
import {
  Configuration,
  AdminReviewsApi,
} from '';
import type { AdminReviewsControllerCreateReviewRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminReviewsApi(config);

  const body = {
    // AdminCreateReviewDto
    adminCreateReviewDto: ...,
  } satisfies AdminReviewsControllerCreateReviewRequest;

  try {
    const data = await api.adminReviewsControllerCreateReview(body);
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
| **adminCreateReviewDto** | [AdminCreateReviewDto](AdminCreateReviewDto.md) |  | |

### Return type

[**AdminReviewResponseDto**](AdminReviewResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Review created |  -  |
| **400** | Invalid input |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminReviewsControllerDeleteReview

> adminReviewsControllerDeleteReview(id)

Delete review (admin)

### Example

```ts
import {
  Configuration,
  AdminReviewsApi,
} from '';
import type { AdminReviewsControllerDeleteReviewRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminReviewsApi(config);

  const body = {
    // string | Review ID (UUID)
    id: id_example,
  } satisfies AdminReviewsControllerDeleteReviewRequest;

  try {
    const data = await api.adminReviewsControllerDeleteReview(body);
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
| **id** | `string` | Review ID (UUID) | [Defaults to `undefined`] |

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
| **404** | Review not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminReviewsControllerGetReview

> AdminReviewResponseDto adminReviewsControllerGetReview(id)

Get review by ID (admin)

### Example

```ts
import {
  Configuration,
  AdminReviewsApi,
} from '';
import type { AdminReviewsControllerGetReviewRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminReviewsApi(config);

  const body = {
    // string | Review ID (UUID)
    id: id_example,
  } satisfies AdminReviewsControllerGetReviewRequest;

  try {
    const data = await api.adminReviewsControllerGetReview(body);
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
| **id** | `string` | Review ID (UUID) | [Defaults to `undefined`] |

### Return type

[**AdminReviewResponseDto**](AdminReviewResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Review details |  -  |
| **404** | Review not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminReviewsControllerGetReviews

> PaginatedAdminReviewsDto adminReviewsControllerGetReviews(page, limit, status, productId, userId, displayOnHomepage, minRating, maxRating, search)

List all reviews with filters (admin)

### Example

```ts
import {
  Configuration,
  AdminReviewsApi,
} from '';
import type { AdminReviewsControllerGetReviewsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminReviewsApi(config);

  const body = {
    // number | Page number (default 1) (optional)
    page: 8.14,
    // number | Items per page (default 20, max 100) (optional)
    limit: 8.14,
    // 'pending' | 'approved' | 'rejected' | Filter by status (optional)
    status: status_example,
    // string | Filter by product ID (optional)
    productId: productId_example,
    // string | Filter by user ID (optional)
    userId: userId_example,
    // boolean | Filter by homepage display (optional)
    displayOnHomepage: true,
    // number | Minimum rating (1-5) (optional)
    minRating: 8.14,
    // number | Maximum rating (1-5) (optional)
    maxRating: 8.14,
    // string | Search in title/content/authorName (optional)
    search: search_example,
  } satisfies AdminReviewsControllerGetReviewsRequest;

  try {
    const data = await api.adminReviewsControllerGetReviews(body);
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
| **page** | `number` | Page number (default 1) | [Optional] [Defaults to `undefined`] |
| **limit** | `number` | Items per page (default 20, max 100) | [Optional] [Defaults to `undefined`] |
| **status** | `pending`, `approved`, `rejected` | Filter by status | [Optional] [Defaults to `undefined`] [Enum: pending, approved, rejected] |
| **productId** | `string` | Filter by product ID | [Optional] [Defaults to `undefined`] |
| **userId** | `string` | Filter by user ID | [Optional] [Defaults to `undefined`] |
| **displayOnHomepage** | `boolean` | Filter by homepage display | [Optional] [Defaults to `undefined`] |
| **minRating** | `number` | Minimum rating (1-5) | [Optional] [Defaults to `undefined`] |
| **maxRating** | `number` | Maximum rating (1-5) | [Optional] [Defaults to `undefined`] |
| **search** | `string` | Search in title/content/authorName | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedAdminReviewsDto**](PaginatedAdminReviewsDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Paginated list of reviews |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminReviewsControllerGetStats

> ReviewStatsDto adminReviewsControllerGetStats()

Get review statistics (admin)

### Example

```ts
import {
  Configuration,
  AdminReviewsApi,
} from '';
import type { AdminReviewsControllerGetStatsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminReviewsApi(config);

  try {
    const data = await api.adminReviewsControllerGetStats();
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

[**ReviewStatsDto**](ReviewStatsDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Review statistics |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminReviewsControllerModerateReview

> AdminReviewResponseDto adminReviewsControllerModerateReview(id, moderateReviewDto)

Moderate review (approve/reject)

### Example

```ts
import {
  Configuration,
  AdminReviewsApi,
} from '';
import type { AdminReviewsControllerModerateReviewRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminReviewsApi(config);

  const body = {
    // string | Review ID (UUID)
    id: id_example,
    // ModerateReviewDto
    moderateReviewDto: ...,
  } satisfies AdminReviewsControllerModerateReviewRequest;

  try {
    const data = await api.adminReviewsControllerModerateReview(body);
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
| **id** | `string` | Review ID (UUID) | [Defaults to `undefined`] |
| **moderateReviewDto** | [ModerateReviewDto](ModerateReviewDto.md) |  | |

### Return type

[**AdminReviewResponseDto**](AdminReviewResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Review moderated |  -  |
| **404** | Review not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminReviewsControllerToggleHomepageDisplay

> AdminReviewResponseDto adminReviewsControllerToggleHomepageDisplay(id)

Toggle homepage display for review

### Example

```ts
import {
  Configuration,
  AdminReviewsApi,
} from '';
import type { AdminReviewsControllerToggleHomepageDisplayRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminReviewsApi(config);

  const body = {
    // string | Review ID (UUID)
    id: id_example,
  } satisfies AdminReviewsControllerToggleHomepageDisplayRequest;

  try {
    const data = await api.adminReviewsControllerToggleHomepageDisplay(body);
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
| **id** | `string` | Review ID (UUID) | [Defaults to `undefined`] |

### Return type

[**AdminReviewResponseDto**](AdminReviewResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Homepage display toggled |  -  |
| **404** | Review not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminReviewsControllerUpdateReview

> AdminReviewResponseDto adminReviewsControllerUpdateReview(id, adminUpdateReviewDto)

Update review (admin)

### Example

```ts
import {
  Configuration,
  AdminReviewsApi,
} from '';
import type { AdminReviewsControllerUpdateReviewRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminReviewsApi(config);

  const body = {
    // string | Review ID (UUID)
    id: id_example,
    // AdminUpdateReviewDto
    adminUpdateReviewDto: ...,
  } satisfies AdminReviewsControllerUpdateReviewRequest;

  try {
    const data = await api.adminReviewsControllerUpdateReview(body);
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
| **id** | `string` | Review ID (UUID) | [Defaults to `undefined`] |
| **adminUpdateReviewDto** | [AdminUpdateReviewDto](AdminUpdateReviewDto.md) |  | |

### Return type

[**AdminReviewResponseDto**](AdminReviewResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Review updated |  -  |
| **404** | Review not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

