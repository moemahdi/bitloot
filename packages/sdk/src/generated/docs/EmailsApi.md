# EmailsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**emailUnsubscribeControllerUnsubscribe**](EmailsApi.md#emailunsubscribecontrollerunsubscribe) | **POST** /emails/unsubscribe | Unsubscribe from marketing emails (RFC 8058) |



## emailUnsubscribeControllerUnsubscribe

> UnsubscribeResponseDto emailUnsubscribeControllerUnsubscribe(unsubscribeEmailDto)

Unsubscribe from marketing emails (RFC 8058)

### Example

```ts
import {
  Configuration,
  EmailsApi,
} from '';
import type { EmailUnsubscribeControllerUnsubscribeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new EmailsApi();

  const body = {
    // UnsubscribeEmailDto
    unsubscribeEmailDto: ...,
  } satisfies EmailUnsubscribeControllerUnsubscribeRequest;

  try {
    const data = await api.emailUnsubscribeControllerUnsubscribe(body);
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
| **unsubscribeEmailDto** | [UnsubscribeEmailDto](UnsubscribeEmailDto.md) |  | |

### Return type

[**UnsubscribeResponseDto**](UnsubscribeResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Email successfully unsubscribed (or was already unsubscribed) |  -  |
| **400** | Invalid token or malformed request |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

