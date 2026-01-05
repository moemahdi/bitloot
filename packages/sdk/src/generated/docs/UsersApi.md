# UsersApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**usersControllerGetOrders**](UsersApi.md#userscontrollergetorders) | **GET** /users/me/orders | Get user\&#39;s orders |
| [**usersControllerGetProfile**](UsersApi.md#userscontrollergetprofile) | **GET** /users/me | Get current user profile |
| [**usersControllerUpdatePassword**](UsersApi.md#userscontrollerupdatepassword) | **PATCH** /users/me/password | Update user password |



## usersControllerGetOrders

> Array&lt;OrderResponseDto&gt; usersControllerGetOrders(page, limit)

Get user\&#39;s orders

### Example

```ts
import {
  Configuration,
  UsersApi,
} from '';
import type { UsersControllerGetOrdersRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new UsersApi(config);

  const body = {
    // number | Page number (default: 1) (optional)
    page: 8.14,
    // number | Items per page (default: 20, max: 100) (optional)
    limit: 8.14,
  } satisfies UsersControllerGetOrdersRequest;

  try {
    const data = await api.usersControllerGetOrders(body);
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
| **page** | `number` | Page number (default: 1) | [Optional] [Defaults to `undefined`] |
| **limit** | `number` | Items per page (default: 20, max: 100) | [Optional] [Defaults to `undefined`] |

### Return type

[**Array&lt;OrderResponseDto&gt;**](OrderResponseDto.md)

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


## usersControllerGetProfile

> UserResponseDto usersControllerGetProfile()

Get current user profile

### Example

```ts
import {
  Configuration,
  UsersApi,
} from '';
import type { UsersControllerGetProfileRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new UsersApi(config);

  try {
    const data = await api.usersControllerGetProfile();
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

[**UserResponseDto**](UserResponseDto.md)

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


## usersControllerUpdatePassword

> usersControllerUpdatePassword(updatePasswordDto)

Update user password

### Example

```ts
import {
  Configuration,
  UsersApi,
} from '';
import type { UsersControllerUpdatePasswordRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new UsersApi(config);

  const body = {
    // UpdatePasswordDto
    updatePasswordDto: ...,
  } satisfies UsersControllerUpdatePasswordRequest;

  try {
    const data = await api.usersControllerUpdatePassword(body);
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
| **updatePasswordDto** | [UpdatePasswordDto](UpdatePasswordDto.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Password updated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

