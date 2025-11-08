# OrdersApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**ordersControllerCreate**](OrdersApi.md#orderscontrollercreate) | **POST** /orders | Create a new order |
| [**ordersControllerGet**](OrdersApi.md#orderscontrollerget) | **GET** /orders/{id} | Get order by ID |



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

Get order by ID

### Example

```ts
import {
  Configuration,
  OrdersApi,
} from '';
import type { OrdersControllerGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new OrdersApi();

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

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

