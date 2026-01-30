# NewsletterApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**newsletterControllerSubscribe**](NewsletterApi.md#newslettercontrollersubscribe) | **POST** /newsletter/subscribe | Subscribe to newsletter |
| [**newsletterControllerUnsubscribe**](NewsletterApi.md#newslettercontrollerunsubscribe) | **POST** /newsletter/unsubscribe | Unsubscribe from newsletter |



## newsletterControllerSubscribe

> NewsletterResponseDto newsletterControllerSubscribe(newsletterSubscribeDto)

Subscribe to newsletter

### Example

```ts
import {
  Configuration,
  NewsletterApi,
} from '';
import type { NewsletterControllerSubscribeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new NewsletterApi();

  const body = {
    // NewsletterSubscribeDto
    newsletterSubscribeDto: ...,
  } satisfies NewsletterControllerSubscribeRequest;

  try {
    const data = await api.newsletterControllerSubscribe(body);
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
| **newsletterSubscribeDto** | [NewsletterSubscribeDto](NewsletterSubscribeDto.md) |  | |

### Return type

[**NewsletterResponseDto**](NewsletterResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Subscription successful |  -  |
| **400** | Invalid email or subscription failed |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## newsletterControllerUnsubscribe

> NewsletterResponseDto newsletterControllerUnsubscribe(newsletterSubscribeDto)

Unsubscribe from newsletter

### Example

```ts
import {
  Configuration,
  NewsletterApi,
} from '';
import type { NewsletterControllerUnsubscribeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new NewsletterApi();

  const body = {
    // NewsletterSubscribeDto
    newsletterSubscribeDto: ...,
  } satisfies NewsletterControllerUnsubscribeRequest;

  try {
    const data = await api.newsletterControllerUnsubscribe(body);
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
| **newsletterSubscribeDto** | [NewsletterSubscribeDto](NewsletterSubscribeDto.md) |  | |

### Return type

[**NewsletterResponseDto**](NewsletterResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Unsubscription successful |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

