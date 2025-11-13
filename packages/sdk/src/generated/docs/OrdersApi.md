# OrdersApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**ordersControllerCreate**](OrdersApi.md#orderscontrollercreate) | **POST** /orders | Create a new order |
| [**ordersControllerGet**](OrdersApi.md#orderscontrollerget) | **GET** /orders/{id} | Get order by ID (requires ownership) |
| [**ordersControllerSetReservation**](OrdersApi.md#orderscontrollersetreservation) | **PATCH** /orders/{id}/reservation | Set Kinguin reservation ID (test/internal use) |



## ordersControllerCreate

> OrderResponseDto ordersControllerCreate(createOrderDto)

Create a new order

### Example

```ts
import {
  Configuration,
  OrdersApi,
} from '';
import type { OrdersControllerCreateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new OrdersApi();

  const body = {
    // CreateOrderDto
    createOrderDto: ...,
  } satisfies OrdersControllerCreateRequest;

  try {
    const data = await api.ordersControllerCreate(body);
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
| **createOrderDto** | [CreateOrderDto](CreateOrderDto.md) |  | |

### Return type

[**OrderResponseDto**](OrderResponseDto.md)

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


## ordersControllerGet

> OrderResponseDto ordersControllerGet(id)

Get order by ID (requires ownership)

### Example

```ts
import {
  Configuration,
  OrdersApi,
} from '';
import type { OrdersControllerGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new OrdersApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies OrdersControllerGetRequest;

  try {
    const data = await api.ordersControllerGet(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**OrderResponseDto**](OrderResponseDto.md)

### Authorization

[JWT-auth](../README.md#JWT-auth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **401** | Unauthorized - missing or invalid JWT |  -  |
| **403** | Forbidden - order does not belong to user |  -  |
| **404** | Order not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## ordersControllerSetReservation

> OrderResponseDto ordersControllerSetReservation(id)

Set Kinguin reservation ID (test/internal use)

### Example

```ts
import {
  Configuration,
  OrdersApi,
} from '';
import type { OrdersControllerSetReservationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new OrdersApi();

  const body = {
    // string
    id: id_example,
  } satisfies OrdersControllerSetReservationRequest;

  try {
    const data = await api.ordersControllerSetReservation(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**OrderResponseDto**](OrderResponseDto.md)

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

