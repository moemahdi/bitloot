# PaymentsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**paymentsControllerAdminListPayments**](PaymentsApi.md#paymentscontrolleradminlistpayments) | **GET** /payments/admin/list | [ADMIN] List all payments with pagination |
| [**paymentsControllerCreate**](PaymentsApi.md#paymentscontrollercreate) | **POST** /payments/create | Create payment invoice (redirect flow) |
| [**paymentsControllerCreateEmbedded**](PaymentsApi.md#paymentscontrollercreateembedded) | **POST** /payments/embedded | Create embedded payment (no redirect) |
| [**paymentsControllerGetJobStatus**](PaymentsApi.md#paymentscontrollergetjobstatus) | **GET** /payments/jobs/{jobId}/status | Get payment job status |
| [**paymentsControllerIpn**](PaymentsApi.md#paymentscontrolleripn) | **POST** /payments/ipn | NOWPayments IPN webhook |
| [**paymentsControllerPollPaymentStatus**](PaymentsApi.md#paymentscontrollerpollpaymentstatus) | **GET** /payments/poll/{paymentId} | Poll payment status from NOWPayments |



## paymentsControllerAdminListPayments

> PaymentsControllerAdminListPayments200Response paymentsControllerAdminListPayments(page, limit, status, provider, orderId)

[ADMIN] List all payments with pagination

Requires admin role in JWT token

### Example

```ts
import {
  Configuration,
  PaymentsApi,
} from '';
import type { PaymentsControllerAdminListPaymentsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new PaymentsApi(config);

  const body = {
    // string
    page: page_example,
    // string
    limit: limit_example,
    // string
    status: status_example,
    // string
    provider: provider_example,
    // string
    orderId: orderId_example,
  } satisfies PaymentsControllerAdminListPaymentsRequest;

  try {
    const data = await api.paymentsControllerAdminListPayments(body);
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
| **page** | `string` |  | [Defaults to `undefined`] |
| **limit** | `string` |  | [Defaults to `undefined`] |
| **status** | `string` |  | [Defaults to `undefined`] |
| **provider** | `string` |  | [Defaults to `undefined`] |
| **orderId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**PaymentsControllerAdminListPayments200Response**](PaymentsControllerAdminListPayments200Response.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Paginated payments list |  -  |
| **401** | Unauthorized or missing JWT |  -  |
| **403** | Forbidden: user is not admin |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## paymentsControllerCreate

> PaymentResponseDto paymentsControllerCreate(createPaymentDto)

Create payment invoice (redirect flow)

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


## paymentsControllerCreateEmbedded

> EmbeddedPaymentResponseDto paymentsControllerCreateEmbedded(createPaymentDto)

Create embedded payment (no redirect)

Creates a payment and returns wallet address + amount for in-app display. No redirect to NOWPayments.

### Example

```ts
import {
  Configuration,
  PaymentsApi,
} from '';
import type { PaymentsControllerCreateEmbeddedRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PaymentsApi();

  const body = {
    // CreatePaymentDto
    createPaymentDto: ...,
  } satisfies PaymentsControllerCreateEmbeddedRequest;

  try {
    const data = await api.paymentsControllerCreateEmbedded(body);
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

[**EmbeddedPaymentResponseDto**](EmbeddedPaymentResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |
| **400** | payCurrency is required for embedded payments |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## paymentsControllerGetJobStatus

> paymentsControllerGetJobStatus(jobId)

Get payment job status

### Example

```ts
import {
  Configuration,
  PaymentsApi,
} from '';
import type { PaymentsControllerGetJobStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PaymentsApi();

  const body = {
    // string
    jobId: jobId_example,
  } satisfies PaymentsControllerGetJobStatusRequest;

  try {
    const data = await api.paymentsControllerGetJobStatus(body);
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
| **jobId** | `string` |  | [Defaults to `undefined`] |

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
| **200** | Job status with progress |  -  |
| **404** | Job not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## paymentsControllerIpn

> IpnResponseDto paymentsControllerIpn(ipnRequestDto)

NOWPayments IPN webhook

Receive payment status updates from NOWPayments. Signature verified with HMAC-SHA512.

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
| **200** | Webhook processed successfully |  -  |
| **400** | Invalid request body |  -  |
| **401** | Invalid HMAC signature |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## paymentsControllerPollPaymentStatus

> PaymentsControllerPollPaymentStatus200Response paymentsControllerPollPaymentStatus(paymentId)

Poll payment status from NOWPayments

Directly polls NOWPayments API for payment status and updates order if needed. Useful when IPN is delayed.

### Example

```ts
import {
  Configuration,
  PaymentsApi,
} from '';
import type { PaymentsControllerPollPaymentStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PaymentsApi();

  const body = {
    // string
    paymentId: paymentId_example,
  } satisfies PaymentsControllerPollPaymentStatusRequest;

  try {
    const data = await api.paymentsControllerPollPaymentStatus(body);
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
| **paymentId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**PaymentsControllerPollPaymentStatus200Response**](PaymentsControllerPollPaymentStatus200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Payment status from NOWPayments |  -  |
| **404** | Payment not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

