# AuthenticationApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**authControllerCancelAccountDeletion**](AuthenticationApi.md#authcontrollercancelaccountdeletion) | **POST** /auth/account/delete/cancel | Cancel pending account deletion |
| [**authControllerCancelDeletionViaToken**](AuthenticationApi.md#authcontrollercanceldeletionviatoken) | **GET** /auth/account/delete/cancel/{token} | Cancel account deletion via email link (public, no auth required) |
| [**authControllerForgotPassword**](AuthenticationApi.md#authcontrollerforgotpassword) | **POST** /auth/forgot-password | Request password reset email |
| [**authControllerGetAccountDeletionStatus**](AuthenticationApi.md#authcontrollergetaccountdeletionstatus) | **GET** /auth/account/delete/status | Get account deletion status |
| [**authControllerGetCancellationToken**](AuthenticationApi.md#authcontrollergetcancellationtoken) | **GET** /auth/account/delete/cancel-token | Get cancellation token for redirect |
| [**authControllerGetOtpForTesting**](AuthenticationApi.md#authcontrollergetotpfortesting) | **POST** /auth/test/get-otp | [TEST ONLY] Get OTP for testing |
| [**authControllerLogout**](AuthenticationApi.md#authcontrollerlogout) | **POST** /auth/logout | Logout user |
| [**authControllerRefresh**](AuthenticationApi.md#authcontrollerrefresh) | **POST** /auth/refresh | Refresh JWT access token |
| [**authControllerRequestAccountDeletion**](AuthenticationApi.md#authcontrollerrequestaccountdeletion) | **POST** /auth/account/delete | Request account deletion (30-day grace period) |
| [**authControllerRequestEmailChange**](AuthenticationApi.md#authcontrollerrequestemailchange) | **POST** /auth/email-change/request | Request email change (sends OTP to BOTH old and new email) |
| [**authControllerRequestOtp**](AuthenticationApi.md#authcontrollerrequestotp) | **POST** /auth/request-otp | Request OTP code via email |
| [**authControllerResetPassword**](AuthenticationApi.md#authcontrollerresetpassword) | **POST** /auth/reset-password | Reset password with token |
| [**authControllerVerifyEmailChange**](AuthenticationApi.md#authcontrollerverifyemailchange) | **POST** /auth/email-change/verify | Verify email change with OTP code(s) |
| [**authControllerVerifyOtp**](AuthenticationApi.md#authcontrollerverifyotp) | **POST** /auth/verify-otp | Verify OTP code and get JWT tokens |



## authControllerCancelAccountDeletion

> CancelDeletionResponseDto authControllerCancelAccountDeletion()

Cancel pending account deletion

### Example

```ts
import {
  Configuration,
  AuthenticationApi,
} from '';
import type { AuthControllerCancelAccountDeletionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthenticationApi(config);

  try {
    const data = await api.authControllerCancelAccountDeletion();
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

[**CancelDeletionResponseDto**](CancelDeletionResponseDto.md)

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


## authControllerCancelDeletionViaToken

> PublicCancelDeletionResponseDto authControllerCancelDeletionViaToken(token)

Cancel account deletion via email link (public, no auth required)

Allows users to cancel their account deletion from the email link without logging in. The token is secure and expires after 30 days.

### Example

```ts
import {
  Configuration,
  AuthenticationApi,
} from '';
import type { AuthControllerCancelDeletionViaTokenRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AuthenticationApi();

  const body = {
    // string | Secure cancellation token from email
    token: YWJjZGVmMTIzNDU2Nzg5MC4xNzAwMDAwMDAwMDAwLmFiY2RlZjEyMzQ1Njc4OTA=,
  } satisfies AuthControllerCancelDeletionViaTokenRequest;

  try {
    const data = await api.authControllerCancelDeletionViaToken(body);
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
| **token** | `string` | Secure cancellation token from email | [Defaults to `undefined`] |

### Return type

[**PublicCancelDeletionResponseDto**](PublicCancelDeletionResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Cancellation result (success, already_cancelled, expired, or invalid) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerForgotPassword

> ForgotPasswordResponseDto authControllerForgotPassword(forgotPasswordDto)

Request password reset email

### Example

```ts
import {
  Configuration,
  AuthenticationApi,
} from '';
import type { AuthControllerForgotPasswordRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AuthenticationApi();

  const body = {
    // ForgotPasswordDto
    forgotPasswordDto: ...,
  } satisfies AuthControllerForgotPasswordRequest;

  try {
    const data = await api.authControllerForgotPassword(body);
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
| **forgotPasswordDto** | [ForgotPasswordDto](ForgotPasswordDto.md) |  | |

### Return type

[**ForgotPasswordResponseDto**](ForgotPasswordResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerGetAccountDeletionStatus

> DeletionResponseDto authControllerGetAccountDeletionStatus()

Get account deletion status

### Example

```ts
import {
  Configuration,
  AuthenticationApi,
} from '';
import type { AuthControllerGetAccountDeletionStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthenticationApi(config);

  try {
    const data = await api.authControllerGetAccountDeletionStatus();
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

[**DeletionResponseDto**](DeletionResponseDto.md)

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


## authControllerGetCancellationToken

> CancellationTokenResponseDto authControllerGetCancellationToken()

Get cancellation token for redirect

### Example

```ts
import {
  Configuration,
  AuthenticationApi,
} from '';
import type { AuthControllerGetCancellationTokenRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthenticationApi(config);

  try {
    const data = await api.authControllerGetCancellationToken();
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

[**CancellationTokenResponseDto**](CancellationTokenResponseDto.md)

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


## authControllerGetOtpForTesting

> any authControllerGetOtpForTesting()

[TEST ONLY] Get OTP for testing

### Example

```ts
import {
  Configuration,
  AuthenticationApi,
} from '';
import type { AuthControllerGetOtpForTestingRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AuthenticationApi();

  try {
    const data = await api.authControllerGetOtpForTesting();
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

**any**

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


## authControllerLogout

> authControllerLogout()

Logout user

### Example

```ts
import {
  Configuration,
  AuthenticationApi,
} from '';
import type { AuthControllerLogoutRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AuthenticationApi();

  try {
    const data = await api.authControllerLogout();
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

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerRefresh

> AuthResponseDto authControllerRefresh()

Refresh JWT access token

### Example

```ts
import {
  Configuration,
  AuthenticationApi,
} from '';
import type { AuthControllerRefreshRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AuthenticationApi();

  try {
    const data = await api.authControllerRefresh();
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

[**AuthResponseDto**](AuthResponseDto.md)

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


## authControllerRequestAccountDeletion

> DeletionResponseDto authControllerRequestAccountDeletion(requestDeletionDto)

Request account deletion (30-day grace period)

### Example

```ts
import {
  Configuration,
  AuthenticationApi,
} from '';
import type { AuthControllerRequestAccountDeletionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthenticationApi(config);

  const body = {
    // RequestDeletionDto
    requestDeletionDto: ...,
  } satisfies AuthControllerRequestAccountDeletionRequest;

  try {
    const data = await api.authControllerRequestAccountDeletion(body);
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
| **requestDeletionDto** | [RequestDeletionDto](RequestDeletionDto.md) |  | |

### Return type

[**DeletionResponseDto**](DeletionResponseDto.md)

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


## authControllerRequestEmailChange

> EmailChangeResponseDto authControllerRequestEmailChange(requestEmailChangeDto)

Request email change (sends OTP to BOTH old and new email)

### Example

```ts
import {
  Configuration,
  AuthenticationApi,
} from '';
import type { AuthControllerRequestEmailChangeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthenticationApi(config);

  const body = {
    // RequestEmailChangeDto
    requestEmailChangeDto: ...,
  } satisfies AuthControllerRequestEmailChangeRequest;

  try {
    const data = await api.authControllerRequestEmailChange(body);
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
| **requestEmailChangeDto** | [RequestEmailChangeDto](RequestEmailChangeDto.md) |  | |

### Return type

[**EmailChangeResponseDto**](EmailChangeResponseDto.md)

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


## authControllerRequestOtp

> OtpResponseDto authControllerRequestOtp(requestOtpDto)

Request OTP code via email

### Example

```ts
import {
  Configuration,
  AuthenticationApi,
} from '';
import type { AuthControllerRequestOtpRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AuthenticationApi();

  const body = {
    // RequestOtpDto
    requestOtpDto: ...,
  } satisfies AuthControllerRequestOtpRequest;

  try {
    const data = await api.authControllerRequestOtp(body);
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
| **requestOtpDto** | [RequestOtpDto](RequestOtpDto.md) |  | |

### Return type

[**OtpResponseDto**](OtpResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerResetPassword

> ResetPasswordResponseDto authControllerResetPassword(resetPasswordDto)

Reset password with token

### Example

```ts
import {
  Configuration,
  AuthenticationApi,
} from '';
import type { AuthControllerResetPasswordRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AuthenticationApi();

  const body = {
    // ResetPasswordDto
    resetPasswordDto: ...,
  } satisfies AuthControllerResetPasswordRequest;

  try {
    const data = await api.authControllerResetPassword(body);
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
| **resetPasswordDto** | [ResetPasswordDto](ResetPasswordDto.md) |  | |

### Return type

[**ResetPasswordResponseDto**](ResetPasswordResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerVerifyEmailChange

> EmailChangeResponseDto authControllerVerifyEmailChange(verifyEmailChangeDto)

Verify email change with OTP code(s)

### Example

```ts
import {
  Configuration,
  AuthenticationApi,
} from '';
import type { AuthControllerVerifyEmailChangeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthenticationApi(config);

  const body = {
    // VerifyEmailChangeDto
    verifyEmailChangeDto: ...,
  } satisfies AuthControllerVerifyEmailChangeRequest;

  try {
    const data = await api.authControllerVerifyEmailChange(body);
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
| **verifyEmailChangeDto** | [VerifyEmailChangeDto](VerifyEmailChangeDto.md) |  | |

### Return type

[**EmailChangeResponseDto**](EmailChangeResponseDto.md)

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


## authControllerVerifyOtp

> AuthResponseDto authControllerVerifyOtp(verifyOtpDto)

Verify OTP code and get JWT tokens

### Example

```ts
import {
  Configuration,
  AuthenticationApi,
} from '';
import type { AuthControllerVerifyOtpRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AuthenticationApi();

  const body = {
    // VerifyOtpDto
    verifyOtpDto: ...,
  } satisfies AuthControllerVerifyOtpRequest;

  try {
    const data = await api.authControllerVerifyOtp(body);
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
| **verifyOtpDto** | [VerifyOtpDto](VerifyOtpDto.md) |  | |

### Return type

[**AuthResponseDto**](AuthResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

