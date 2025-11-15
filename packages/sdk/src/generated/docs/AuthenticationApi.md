# AuthenticationApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**authControllerForgotPassword**](AuthenticationApi.md#authcontrollerforgotpassword) | **POST** /auth/forgot-password | Request password reset email |
| [**authControllerGetOtpForTesting**](AuthenticationApi.md#authcontrollergetotpfortesting) | **POST** /auth/test/get-otp | [TEST ONLY] Get OTP for testing |
| [**authControllerLogout**](AuthenticationApi.md#authcontrollerlogout) | **POST** /auth/logout | Logout user |
| [**authControllerRefresh**](AuthenticationApi.md#authcontrollerrefresh) | **POST** /auth/refresh | Refresh JWT access token |
| [**authControllerRequestOtp**](AuthenticationApi.md#authcontrollerrequestotp) | **POST** /auth/request-otp | Request OTP code via email |
| [**authControllerResetPassword**](AuthenticationApi.md#authcontrollerresetpassword) | **POST** /auth/reset-password | Reset password with token |
| [**authControllerVerifyOtp**](AuthenticationApi.md#authcontrollerverifyotp) | **POST** /auth/verify-otp | Verify OTP code and get JWT tokens |



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

