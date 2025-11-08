# PaymentsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**paymentsControllerCreate**](PaymentsApi.md#paymentscontrollercreate) | **POST** /payments/create | Create a fake payment |
| [**paymentsControllerIpn**](PaymentsApi.md#paymentscontrolleripn) | **POST** /payments/ipn | Fake IPN webhook to trigger fulfillment |



## paymentsControllerCreate

> PaymentResponseDto paymentsControllerCreate(createPaymentDto)

Create a fake payment

### Example

```ts
import {
  Configuration,
  PaymentsApi,
} from '';
import type { PaymentsControllerCreateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PaymentsApi();

  const body = {
    // CreatePaymentDto
    createPaymentDto: ...,
  } satisfies PaymentsControllerCreateRequest;

  try {
    const data = await api.paymentsControllerCreate(body);
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
| **createPaymentDto** | [CreatePaymentDto](CreatePaymentDto.md) |  | |

### Return type

[**PaymentResponseDto**](PaymentResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## paymentsControllerIpn

> IpnResponseDto paymentsControllerIpn(ipnRequestDto)

Fake IPN webhook to trigger fulfillment

### Example

```ts
import {
  Configuration,
  PaymentsApi,
} from '';
import type { PaymentsControllerIpnRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PaymentsApi();

  const body = {
    // IpnRequestDto
    ipnRequestDto: ...,
  } satisfies PaymentsControllerIpnRequest;

  try {
    const data = await api.paymentsControllerIpn(body);
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
| **ipnRequestDto** | [IpnRequestDto](IpnRequestDto.md) |  | |

### Return type

[**IpnResponseDto**](IpnResponseDto.md)

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

