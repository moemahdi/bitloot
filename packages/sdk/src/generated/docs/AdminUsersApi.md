# AdminUsersApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminUsersControllerChangeRole**](AdminUsersApi.md#adminuserscontrollerchangerole) | **PATCH** /admin/users/{id}/role | Change user role |
| [**adminUsersControllerCreateUser**](AdminUsersApi.md#adminuserscontrollercreateuser) | **POST** /admin/users | Create a new user |
| [**adminUsersControllerDeleteUser**](AdminUsersApi.md#adminuserscontrollerdeleteuser) | **DELETE** /admin/users/{id} | Soft delete a user |
| [**adminUsersControllerExportUsers**](AdminUsersApi.md#adminuserscontrollerexportusers) | **GET** /admin/users/export | Export users as CSV |
| [**adminUsersControllerForceLogout**](AdminUsersApi.md#adminuserscontrollerforcelogout) | **POST** /admin/users/{id}/force-logout | Force logout user from all sessions |
| [**adminUsersControllerGetStats**](AdminUsersApi.md#adminuserscontrollergetstats) | **GET** /admin/users/stats | Get user statistics |
| [**adminUsersControllerGetUser**](AdminUsersApi.md#adminuserscontrollergetuser) | **GET** /admin/users/{id} | Get user details by ID |
| [**adminUsersControllerGetUserActivity**](AdminUsersApi.md#adminuserscontrollergetuseractivity) | **GET** /admin/users/{id}/activity | Get user activity log |
| [**adminUsersControllerGetUserOrders**](AdminUsersApi.md#adminuserscontrollergetuserorders) | **GET** /admin/users/{id}/orders | Get user orders |
| [**adminUsersControllerGetUserPromos**](AdminUsersApi.md#adminuserscontrollergetuserpromos) | **GET** /admin/users/{id}/promos | Get user promo redemptions |
| [**adminUsersControllerGetUserReviews**](AdminUsersApi.md#adminuserscontrollergetuserreviews) | **GET** /admin/users/{id}/reviews | Get user reviews |
| [**adminUsersControllerGetUserSessions**](AdminUsersApi.md#adminuserscontrollergetusersessions) | **GET** /admin/users/{id}/sessions | Get user sessions |
| [**adminUsersControllerGetUserWatchlist**](AdminUsersApi.md#adminuserscontrollergetuserwatchlist) | **GET** /admin/users/{id}/watchlist | Get user watchlist |
| [**adminUsersControllerHardDeleteUser**](AdminUsersApi.md#adminuserscontrollerharddeleteuser) | **DELETE** /admin/users/{id}/permanent | Permanently delete a user (GDPR) |
| [**adminUsersControllerListUsers**](AdminUsersApi.md#adminuserscontrollerlistusers) | **GET** /admin/users | List all users with filtering and pagination |
| [**adminUsersControllerResetPassword**](AdminUsersApi.md#adminuserscontrollerresetpassword) | **POST** /admin/users/{id}/reset-password | Initiate password reset for user |
| [**adminUsersControllerRestoreUser**](AdminUsersApi.md#adminuserscontrollerrestoreuser) | **POST** /admin/users/{id}/restore | Restore a soft-deleted user |
| [**adminUsersControllerRevokeSession**](AdminUsersApi.md#adminuserscontrollerrevokesession) | **DELETE** /admin/users/{id}/sessions/{sessionId} | Revoke a specific user session |
| [**adminUsersControllerSuspendUser**](AdminUsersApi.md#adminuserscontrollersuspenduser) | **POST** /admin/users/{id}/suspend | Suspend a user |
| [**adminUsersControllerUnsuspendUser**](AdminUsersApi.md#adminuserscontrollerunsuspenduser) | **POST** /admin/users/{id}/unsuspend | Unsuspend a user |
| [**adminUsersControllerUpdateUser**](AdminUsersApi.md#adminuserscontrollerupdateuser) | **PATCH** /admin/users/{id} | Update user details |



## adminUsersControllerChangeRole

> AdminUserDetailDto adminUsersControllerChangeRole(id, changeUserRoleDto)

Change user role

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerChangeRoleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // ChangeUserRoleDto
    changeUserRoleDto: ...,
  } satisfies AdminUsersControllerChangeRoleRequest;

  try {
    const data = await api.adminUsersControllerChangeRole(body);
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
| **changeUserRoleDto** | [ChangeUserRoleDto](ChangeUserRoleDto.md) |  | |

### Return type

[**AdminUserDetailDto**](AdminUserDetailDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | User not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerCreateUser

> AdminUsersControllerCreateUser201Response adminUsersControllerCreateUser(createAdminUserDto)

Create a new user

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerCreateUserRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // CreateAdminUserDto
    createAdminUserDto: ...,
  } satisfies AdminUsersControllerCreateUserRequest;

  try {
    const data = await api.adminUsersControllerCreateUser(body);
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
| **createAdminUserDto** | [CreateAdminUserDto](CreateAdminUserDto.md) |  | |

### Return type

[**AdminUsersControllerCreateUser201Response**](AdminUsersControllerCreateUser201Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | User created |  -  |
| **409** | Email already registered |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerDeleteUser

> AdminUsersControllerDeleteUser200Response adminUsersControllerDeleteUser(id)

Soft delete a user

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerDeleteUserRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies AdminUsersControllerDeleteUserRequest;

  try {
    const data = await api.adminUsersControllerDeleteUser(body);
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

[**AdminUsersControllerDeleteUser200Response**](AdminUsersControllerDeleteUser200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | User not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerExportUsers

> adminUsersControllerExportUsers(role, status)

Export users as CSV

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerExportUsersRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // 'user' | 'admin' (optional)
    role: role_example,
    // 'active' | 'suspended' | 'deleted' (optional)
    status: status_example,
  } satisfies AdminUsersControllerExportUsersRequest;

  try {
    const data = await api.adminUsersControllerExportUsers(body);
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
| **role** | `user`, `admin` |  | [Optional] [Defaults to `undefined`] [Enum: user, admin] |
| **status** | `active`, `suspended`, `deleted` |  | [Optional] [Defaults to `undefined`] [Enum: active, suspended, deleted] |

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
| **200** | CSV file |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerForceLogout

> AdminUsersControllerForceLogout200Response adminUsersControllerForceLogout(id)

Force logout user from all sessions

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerForceLogoutRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies AdminUsersControllerForceLogoutRequest;

  try {
    const data = await api.adminUsersControllerForceLogout(body);
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

[**AdminUsersControllerForceLogout200Response**](AdminUsersControllerForceLogout200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | User not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerGetStats

> AdminUserStatsDto adminUsersControllerGetStats()

Get user statistics

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerGetStatsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  try {
    const data = await api.adminUsersControllerGetStats();
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

[**AdminUserStatsDto**](AdminUserStatsDto.md)

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


## adminUsersControllerGetUser

> AdminUserDetailDto adminUsersControllerGetUser(id)

Get user details by ID

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerGetUserRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies AdminUsersControllerGetUserRequest;

  try {
    const data = await api.adminUsersControllerGetUser(body);
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

[**AdminUserDetailDto**](AdminUserDetailDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | User not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerGetUserActivity

> PaginatedUserActivityDto adminUsersControllerGetUserActivity(id, limit, offset)

Get user activity log

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerGetUserActivityRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // number (optional)
    limit: 8.14,
    // number (optional)
    offset: 8.14,
  } satisfies AdminUsersControllerGetUserActivityRequest;

  try {
    const data = await api.adminUsersControllerGetUserActivity(body);
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
| **limit** | `number` |  | [Optional] [Defaults to `undefined`] |
| **offset** | `number` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedUserActivityDto**](PaginatedUserActivityDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | User not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerGetUserOrders

> PaginatedUserOrdersDto adminUsersControllerGetUserOrders(id, limit, offset)

Get user orders

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerGetUserOrdersRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // number (optional)
    limit: 8.14,
    // number (optional)
    offset: 8.14,
  } satisfies AdminUsersControllerGetUserOrdersRequest;

  try {
    const data = await api.adminUsersControllerGetUserOrders(body);
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
| **limit** | `number` |  | [Optional] [Defaults to `undefined`] |
| **offset** | `number` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedUserOrdersDto**](PaginatedUserOrdersDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | User not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerGetUserPromos

> PaginatedUserPromosDto adminUsersControllerGetUserPromos(id, limit, offset)

Get user promo redemptions

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerGetUserPromosRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // number (optional)
    limit: 8.14,
    // number (optional)
    offset: 8.14,
  } satisfies AdminUsersControllerGetUserPromosRequest;

  try {
    const data = await api.adminUsersControllerGetUserPromos(body);
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
| **limit** | `number` |  | [Optional] [Defaults to `undefined`] |
| **offset** | `number` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedUserPromosDto**](PaginatedUserPromosDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | User not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerGetUserReviews

> PaginatedUserReviewsDto adminUsersControllerGetUserReviews(id, limit, offset)

Get user reviews

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerGetUserReviewsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // number (optional)
    limit: 8.14,
    // number (optional)
    offset: 8.14,
  } satisfies AdminUsersControllerGetUserReviewsRequest;

  try {
    const data = await api.adminUsersControllerGetUserReviews(body);
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
| **limit** | `number` |  | [Optional] [Defaults to `undefined`] |
| **offset** | `number` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedUserReviewsDto**](PaginatedUserReviewsDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | User not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerGetUserSessions

> PaginatedUserSessionsDto adminUsersControllerGetUserSessions(id, limit, offset)

Get user sessions

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerGetUserSessionsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // number (optional)
    limit: 8.14,
    // number (optional)
    offset: 8.14,
  } satisfies AdminUsersControllerGetUserSessionsRequest;

  try {
    const data = await api.adminUsersControllerGetUserSessions(body);
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
| **limit** | `number` |  | [Optional] [Defaults to `undefined`] |
| **offset** | `number` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedUserSessionsDto**](PaginatedUserSessionsDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | User not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerGetUserWatchlist

> PaginatedUserWatchlistDto adminUsersControllerGetUserWatchlist(id, limit, offset)

Get user watchlist

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerGetUserWatchlistRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // number (optional)
    limit: 8.14,
    // number (optional)
    offset: 8.14,
  } satisfies AdminUsersControllerGetUserWatchlistRequest;

  try {
    const data = await api.adminUsersControllerGetUserWatchlist(body);
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
| **limit** | `number` |  | [Optional] [Defaults to `undefined`] |
| **offset** | `number` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedUserWatchlistDto**](PaginatedUserWatchlistDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | User not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerHardDeleteUser

> AdminUsersControllerDeleteUser200Response adminUsersControllerHardDeleteUser(id)

Permanently delete a user (GDPR)

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerHardDeleteUserRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies AdminUsersControllerHardDeleteUserRequest;

  try {
    const data = await api.adminUsersControllerHardDeleteUser(body);
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

[**AdminUsersControllerDeleteUser200Response**](AdminUsersControllerDeleteUser200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | User not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerListUsers

> PaginatedAdminUsersDto adminUsersControllerListUsers(limit, offset, search, role, status, emailConfirmed, sortBy, sortOrder)

List all users with filtering and pagination

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerListUsersRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // number | Number of items per page (optional)
    limit: 8.14,
    // number | Offset for pagination (optional)
    offset: 8.14,
    // string | Search by email (partial match) (optional)
    search: search_example,
    // 'user' | 'admin' | Filter by role (optional)
    role: role_example,
    // 'active' | 'suspended' | 'deleted' | Filter by status (optional)
    status: status_example,
    // boolean | Filter by email confirmed status (optional)
    emailConfirmed: true,
    // 'email' | 'createdAt' | 'lastLoginAt' | 'ordersCount' | 'totalSpent' | Sort by field (optional)
    sortBy: sortBy_example,
    // 'asc' | 'desc' | Sort order (optional)
    sortOrder: sortOrder_example,
  } satisfies AdminUsersControllerListUsersRequest;

  try {
    const data = await api.adminUsersControllerListUsers(body);
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
| **limit** | `number` | Number of items per page | [Optional] [Defaults to `25`] |
| **offset** | `number` | Offset for pagination | [Optional] [Defaults to `0`] |
| **search** | `string` | Search by email (partial match) | [Optional] [Defaults to `undefined`] |
| **role** | `user`, `admin` | Filter by role | [Optional] [Defaults to `undefined`] [Enum: user, admin] |
| **status** | `active`, `suspended`, `deleted` | Filter by status | [Optional] [Defaults to `undefined`] [Enum: active, suspended, deleted] |
| **emailConfirmed** | `boolean` | Filter by email confirmed status | [Optional] [Defaults to `undefined`] |
| **sortBy** | `email`, `createdAt`, `lastLoginAt`, `ordersCount`, `totalSpent` | Sort by field | [Optional] [Defaults to `undefined`] [Enum: email, createdAt, lastLoginAt, ordersCount, totalSpent] |
| **sortOrder** | `asc`, `desc` | Sort order | [Optional] [Defaults to `&#39;desc&#39;`] [Enum: asc, desc] |

### Return type

[**PaginatedAdminUsersDto**](PaginatedAdminUsersDto.md)

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


## adminUsersControllerResetPassword

> AdminUsersControllerDeleteUser200Response adminUsersControllerResetPassword(id)

Initiate password reset for user

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerResetPasswordRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies AdminUsersControllerResetPasswordRequest;

  try {
    const data = await api.adminUsersControllerResetPassword(body);
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

[**AdminUsersControllerDeleteUser200Response**](AdminUsersControllerDeleteUser200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | User not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerRestoreUser

> AdminUserDetailDto adminUsersControllerRestoreUser(id)

Restore a soft-deleted user

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerRestoreUserRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies AdminUsersControllerRestoreUserRequest;

  try {
    const data = await api.adminUsersControllerRestoreUser(body);
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

[**AdminUserDetailDto**](AdminUserDetailDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **400** | User is not deleted |  -  |
| **404** | User not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerRevokeSession

> AdminUsersControllerDeleteUser200Response adminUsersControllerRevokeSession(id, sessionId)

Revoke a specific user session

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerRevokeSessionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    sessionId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies AdminUsersControllerRevokeSessionRequest;

  try {
    const data = await api.adminUsersControllerRevokeSession(body);
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
| **sessionId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**AdminUsersControllerDeleteUser200Response**](AdminUsersControllerDeleteUser200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | User or session not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerSuspendUser

> AdminUserDetailDto adminUsersControllerSuspendUser(id, suspendUserDto)

Suspend a user

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerSuspendUserRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // SuspendUserDto
    suspendUserDto: ...,
  } satisfies AdminUsersControllerSuspendUserRequest;

  try {
    const data = await api.adminUsersControllerSuspendUser(body);
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
| **suspendUserDto** | [SuspendUserDto](SuspendUserDto.md) |  | |

### Return type

[**AdminUserDetailDto**](AdminUserDetailDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **400** | User is already suspended |  -  |
| **404** | User not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerUnsuspendUser

> AdminUserDetailDto adminUsersControllerUnsuspendUser(id)

Unsuspend a user

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerUnsuspendUserRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies AdminUsersControllerUnsuspendUserRequest;

  try {
    const data = await api.adminUsersControllerUnsuspendUser(body);
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

[**AdminUserDetailDto**](AdminUserDetailDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **400** | User is not suspended |  -  |
| **404** | User not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminUsersControllerUpdateUser

> AdminUserDetailDto adminUsersControllerUpdateUser(id, updateAdminUserDto)

Update user details

### Example

```ts
import {
  Configuration,
  AdminUsersApi,
} from '';
import type { AdminUsersControllerUpdateUserRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AdminUsersApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // UpdateAdminUserDto
    updateAdminUserDto: ...,
  } satisfies AdminUsersControllerUpdateUserRequest;

  try {
    const data = await api.adminUsersControllerUpdateUser(body);
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
| **updateAdminUserDto** | [UpdateAdminUserDto](UpdateAdminUserDto.md) |  | |

### Return type

[**AdminUserDetailDto**](AdminUserDetailDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **404** | User not found |  -  |
| **409** | Email already registered |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

