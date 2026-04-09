# CreditsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**creditsControllerConfirmTopup**](CreditsApi.md#creditscontrollerconfirmtopup) | **POST** /credits/topup/{id}/confirm | Manual confirm top-up (fallback when IPN not received) |
| [**creditsControllerCreateTopup**](CreditsApi.md#creditscontrollercreatetopup) | **POST** /credits/topup | Create a credit top-up record (step 1) |
| [**creditsControllerCreateTopupPayment**](CreditsApi.md#creditscontrollercreatetopuppayment) | **POST** /credits/topup/{id}/pay | Create embedded payment for a top-up (step 2) |
| [**creditsControllerGetBalance**](CreditsApi.md#creditscontrollergetbalance) | **GET** /credits/balance | Get current credit balance |
| [**creditsControllerGetExpiring**](CreditsApi.md#creditscontrollergetexpiring) | **GET** /credits/expiring | Get promo credits expiring within 30 days |
| [**creditsControllerGetTopup**](CreditsApi.md#creditscontrollergettopup) | **GET** /credits/topup/{id} | Get top-up details |
| [**creditsControllerGetTopupStatus**](CreditsApi.md#creditscontrollergettopupstatus) | **GET** /credits/topup/{id}/status | Get top-up status with payment info (for polling) |
| [**creditsControllerGetTransactions**](CreditsApi.md#creditscontrollergettransactions) | **GET** /credits/transactions | Get transaction history (paginated) |



## creditsControllerConfirmTopup

> ConfirmTopupResponseDto creditsControllerConfirmTopup(id)

Manual confirm top-up (fallback when IPN not received)

Verifies payment status with NOWPayments and grants credits if payment is finished

### Example

```ts
import {
  Configuration,
  CreditsApi,
} from '';
import type { CreditsControllerConfirmTopupRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CreditsApi(config);

  const body = {
    // string | Top-up ID
    id: id_example,
  } satisfies CreditsControllerConfirmTopupRequest;

  try {
    const data = await api.creditsControllerConfirmTopup(body);
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
| **id** | `string` | Top-up ID | [Defaults to `undefined`] |

### Return type

[**ConfirmTopupResponseDto**](ConfirmTopupResponseDto.md)

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


## creditsControllerCreateTopup

> TopupResponseDto creditsControllerCreateTopup(createTopupDto)

Create a credit top-up record (step 1)

### Example

```ts
import {
  Configuration,
  CreditsApi,
} from '';
import type { CreditsControllerCreateTopupRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CreditsApi(config);

  const body = {
    // CreateTopupDto
    createTopupDto: ...,
  } satisfies CreditsControllerCreateTopupRequest;

  try {
    const data = await api.creditsControllerCreateTopup(body);
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
| **createTopupDto** | [CreateTopupDto](CreateTopupDto.md) |  | |

### Return type

[**TopupResponseDto**](TopupResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## creditsControllerCreateTopupPayment

> EmbeddedPaymentResponseDto creditsControllerCreateTopupPayment(id, createTopupPaymentDto)

Create embedded payment for a top-up (step 2)

### Example

```ts
import {
  Configuration,
  CreditsApi,
} from '';
import type { CreditsControllerCreateTopupPaymentRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CreditsApi(config);

  const body = {
    // string | Top-up ID
    id: id_example,
    // CreateTopupPaymentDto
    createTopupPaymentDto: ...,
  } satisfies CreditsControllerCreateTopupPaymentRequest;

  try {
    const data = await api.creditsControllerCreateTopupPayment(body);
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
| **id** | `string` | Top-up ID | [Defaults to `undefined`] |
| **createTopupPaymentDto** | [CreateTopupPaymentDto](CreateTopupPaymentDto.md) |  | |

### Return type

[**EmbeddedPaymentResponseDto**](EmbeddedPaymentResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## creditsControllerGetBalance

> CreditBalanceDto creditsControllerGetBalance()

Get current credit balance

### Example

```ts
import {
  Configuration,
  CreditsApi,
} from '';
import type { CreditsControllerGetBalanceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CreditsApi(config);

  try {
    const data = await api.creditsControllerGetBalance();
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

[**CreditBalanceDto**](CreditBalanceDto.md)

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


## creditsControllerGetExpiring

> ExpiringCreditsDto creditsControllerGetExpiring()

Get promo credits expiring within 30 days

### Example

```ts
import {
  Configuration,
  CreditsApi,
} from '';
import type { CreditsControllerGetExpiringRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CreditsApi(config);

  try {
    const data = await api.creditsControllerGetExpiring();
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

[**ExpiringCreditsDto**](ExpiringCreditsDto.md)

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


## creditsControllerGetTopup

> TopupResponseDto creditsControllerGetTopup(id)

Get top-up details

### Example

```ts
import {
  Configuration,
  CreditsApi,
} from '';
import type { CreditsControllerGetTopupRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CreditsApi(config);

  const body = {
    // string | Top-up ID
    id: id_example,
  } satisfies CreditsControllerGetTopupRequest;

  try {
    const data = await api.creditsControllerGetTopup(body);
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
| **id** | `string` | Top-up ID | [Defaults to `undefined`] |

### Return type

[**TopupResponseDto**](TopupResponseDto.md)

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


## creditsControllerGetTopupStatus

> TopupStatusResponseDto creditsControllerGetTopupStatus(id)

Get top-up status with payment info (for polling)

### Example

```ts
import {
  Configuration,
  CreditsApi,
} from '';
import type { CreditsControllerGetTopupStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CreditsApi(config);

  const body = {
    // string | Top-up ID
    id: id_example,
  } satisfies CreditsControllerGetTopupStatusRequest;

  try {
    const data = await api.creditsControllerGetTopupStatus(body);
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
| **id** | `string` | Top-up ID | [Defaults to `undefined`] |

### Return type

[**TopupStatusResponseDto**](TopupStatusResponseDto.md)

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


## creditsControllerGetTransactions

> CreditTransactionListDto creditsControllerGetTransactions(page, limit, creditType)

Get transaction history (paginated)

### Example

```ts
import {
  Configuration,
  CreditsApi,
} from '';
import type { CreditsControllerGetTransactionsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CreditsApi(config);

  const body = {
    // number | Page number (optional)
    page: 8.14,
    // number | Items per page (optional)
    limit: 8.14,
    // 'cash' | 'promo' | Filter by credit type (optional)
    creditType: creditType_example,
  } satisfies CreditsControllerGetTransactionsRequest;

  try {
    const data = await api.creditsControllerGetTransactions(body);
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
| **page** | `number` | Page number | [Optional] [Defaults to `1`] |
| **limit** | `number` | Items per page | [Optional] [Defaults to `20`] |
| **creditType** | `cash`, `promo` | Filter by credit type | [Optional] [Defaults to `undefined`] [Enum: cash, promo] |

### Return type

[**CreditTransactionListDto**](CreditTransactionListDto.md)

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

