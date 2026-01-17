# PromosApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**promosControllerValidate**](PromosApi.md#promoscontrollervalidate) | **POST** /promos/validate | Validate a promo code for checkout |



## promosControllerValidate

> ValidatePromoResponseDto promosControllerValidate(validatePromoDto)

Validate a promo code for checkout

### Example

```ts
import {
  Configuration,
  PromosApi,
} from '';
import type { PromosControllerValidateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PromosApi();

  const body = {
    // ValidatePromoDto
    validatePromoDto: ...,
  } satisfies PromosControllerValidateRequest;

  try {
    const data = await api.promosControllerValidate(body);
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
| **validatePromoDto** | [ValidatePromoDto](ValidatePromoDto.md) |  | |

### Return type

[**ValidatePromoResponseDto**](ValidatePromoResponseDto.md)

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

