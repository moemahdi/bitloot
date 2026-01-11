# SessionsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**sessionControllerGetActiveSessions**](SessionsApi.md#sessioncontrollergetactivesessions) | **GET** /sessions | Get all active sessions for current user |
| [**sessionControllerGetSessionCount**](SessionsApi.md#sessioncontrollergetsessioncount) | **GET** /sessions/count | Get active session count |
| [**sessionControllerRevokeAllSessions**](SessionsApi.md#sessioncontrollerrevokeallsessions) | **DELETE** /sessions | Revoke all sessions (logout from all devices) |
| [**sessionControllerRevokeSession**](SessionsApi.md#sessioncontrollerrevokesession) | **DELETE** /sessions/{sessionId} | Revoke a specific session |
| [**sessionControllerValidateSession**](SessionsApi.md#sessioncontrollervalidatesession) | **GET** /sessions/validate/{sessionId} | Validate if session is still active |



## sessionControllerGetActiveSessions

> sessionControllerGetActiveSessions(currentSessionId, page, limit)

Get all active sessions for current user

### Example

```ts
import {
  Configuration,
  SessionsApi,
} from '';
import type { SessionControllerGetActiveSessionsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SessionsApi(config);

  const body = {
    // string
    currentSessionId: currentSessionId_example,
    // string
    page: page_example,
    // string
    limit: limit_example,
  } satisfies SessionControllerGetActiveSessionsRequest;

  try {
    const data = await api.sessionControllerGetActiveSessions(body);
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
| **currentSessionId** | `string` |  | [Defaults to `undefined`] |
| **page** | `string` |  | [Defaults to `undefined`] |
| **limit** | `string` |  | [Defaults to `undefined`] |

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
| **200** | List of active sessions with pagination |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## sessionControllerGetSessionCount

> sessionControllerGetSessionCount()

Get active session count

### Example

```ts
import {
  Configuration,
  SessionsApi,
} from '';
import type { SessionControllerGetSessionCountRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SessionsApi(config);

  try {
    const data = await api.sessionControllerGetSessionCount();
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

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Session count |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## sessionControllerRevokeAllSessions

> sessionControllerRevokeAllSessions()

Revoke all sessions (logout from all devices)

### Example

```ts
import {
  Configuration,
  SessionsApi,
} from '';
import type { SessionControllerRevokeAllSessionsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SessionsApi(config);

  try {
    const data = await api.sessionControllerRevokeAllSessions();
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

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | All sessions revoked successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## sessionControllerRevokeSession

> sessionControllerRevokeSession(sessionId)

Revoke a specific session

### Example

```ts
import {
  Configuration,
  SessionsApi,
} from '';
import type { SessionControllerRevokeSessionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SessionsApi(config);

  const body = {
    // string
    sessionId: sessionId_example,
  } satisfies SessionControllerRevokeSessionRequest;

  try {
    const data = await api.sessionControllerRevokeSession(body);
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
| **sessionId** | `string` |  | [Defaults to `undefined`] |

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
| **200** | Session revoked successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## sessionControllerValidateSession

> sessionControllerValidateSession(sessionId)

Validate if session is still active

### Example

```ts
import {
  Configuration,
  SessionsApi,
} from '';
import type { SessionControllerValidateSessionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SessionsApi(config);

  const body = {
    // string
    sessionId: sessionId_example,
  } satisfies SessionControllerValidateSessionRequest;

  try {
    const data = await api.sessionControllerValidateSession(body);
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
| **sessionId** | `string` |  | [Defaults to `undefined`] |

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
| **200** | Session validation result |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

