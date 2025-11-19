# AuditLogsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**auditLogControllerCreate**](AuditLogsApi.md#auditlogcontrollercreate) | **POST** /admin/audit-logs | Create audit log entry |
| [**auditLogControllerExport**](AuditLogsApi.md#auditlogcontrollerexport) | **GET** /admin/audit-logs/export | Export audit logs as JSON |
| [**auditLogControllerQuery**](AuditLogsApi.md#auditlogcontrollerquery) | **GET** /admin/audit-logs | Query audit logs with filtering |



## auditLogControllerCreate

> AuditLogResponseDto auditLogControllerCreate(createAuditLogDto)

Create audit log entry

### Example

```ts
import {
  Configuration,
  AuditLogsApi,
} from '';
import type { AuditLogControllerCreateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuditLogsApi(config);

  const body = {
    // CreateAuditLogDto
    createAuditLogDto: ...,
  } satisfies AuditLogControllerCreateRequest;

  try {
    const data = await api.auditLogControllerCreate(body);
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
| **createAuditLogDto** | [CreateAuditLogDto](CreateAuditLogDto.md) |  | |

### Return type

[**AuditLogResponseDto**](AuditLogResponseDto.md)

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


## auditLogControllerExport

> Array&lt;AuditLogResponseDto&gt; auditLogControllerExport(fromDate, toDate)

Export audit logs as JSON

### Example

```ts
import {
  Configuration,
  AuditLogsApi,
} from '';
import type { AuditLogControllerExportRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuditLogsApi(config);

  const body = {
    // string
    fromDate: fromDate_example,
    // string
    toDate: toDate_example,
  } satisfies AuditLogControllerExportRequest;

  try {
    const data = await api.auditLogControllerExport(body);
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
| **fromDate** | `string` |  | [Defaults to `undefined`] |
| **toDate** | `string` |  | [Defaults to `undefined`] |

### Return type

[**Array&lt;AuditLogResponseDto&gt;**](AuditLogResponseDto.md)

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


## auditLogControllerQuery

> PaginatedAuditLogsDto auditLogControllerQuery(adminUserId, action, target, fromDate, toDate, limit, offset)

Query audit logs with filtering

### Example

```ts
import {
  Configuration,
  AuditLogsApi,
} from '';
import type { AuditLogControllerQueryRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: JWT-auth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuditLogsApi(config);

  const body = {
    // string (optional)
    adminUserId: adminUserId_example,
    // string (optional)
    action: action_example,
    // string (optional)
    target: target_example,
    // string (optional)
    fromDate: fromDate_example,
    // string (optional)
    toDate: toDate_example,
    // number (optional)
    limit: 8.14,
    // number (optional)
    offset: 8.14,
  } satisfies AuditLogControllerQueryRequest;

  try {
    const data = await api.auditLogControllerQuery(body);
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
| **adminUserId** | `string` |  | [Optional] [Defaults to `undefined`] |
| **action** | `string` |  | [Optional] [Defaults to `undefined`] |
| **target** | `string` |  | [Optional] [Defaults to `undefined`] |
| **fromDate** | `string` |  | [Optional] [Defaults to `undefined`] |
| **toDate** | `string` |  | [Optional] [Defaults to `undefined`] |
| **limit** | `number` |  | [Optional] [Defaults to `50`] |
| **offset** | `number` |  | [Optional] [Defaults to `0`] |

### Return type

[**PaginatedAuditLogsDto**](PaginatedAuditLogsDto.md)

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

