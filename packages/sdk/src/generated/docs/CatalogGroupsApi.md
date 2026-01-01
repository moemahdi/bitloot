# CatalogGroupsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**groupsControllerGetGroup**](CatalogGroupsApi.md#groupscontrollergetgroup) | **GET** /catalog/groups/{slugOrId} | Get product group with all variants |
| [**groupsControllerListGroups**](CatalogGroupsApi.md#groupscontrollerlistgroups) | **GET** /catalog/groups | List all active product groups |



## groupsControllerGetGroup

> ProductGroupWithProductsDto groupsControllerGetGroup(slugOrId)

Get product group with all variants

Returns a product group with all its published products. Used to populate the variant selection modal.

### Example

```ts
import {
  Configuration,
  CatalogGroupsApi,
} from '';
import type { GroupsControllerGetGroupRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new CatalogGroupsApi();

  const body = {
    // string | Group slug (e.g., \"battlefield-6\") or UUID
    slugOrId: battlefield-6,
  } satisfies GroupsControllerGetGroupRequest;

  try {
    const data = await api.groupsControllerGetGroup(body);
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
| **slugOrId** | `string` | Group slug (e.g., \&quot;battlefield-6\&quot;) or UUID | [Defaults to `undefined`] |

### Return type

[**ProductGroupWithProductsDto**](ProductGroupWithProductsDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Product group with all variant products |  -  |
| **404** | Group not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## groupsControllerListGroups

> Array&lt;ProductGroupResponseDto&gt; groupsControllerListGroups()

List all active product groups

Returns all active product groups for display in the catalog. Groups are ordered by displayOrder then createdAt.

### Example

```ts
import {
  Configuration,
  CatalogGroupsApi,
} from '';
import type { GroupsControllerListGroupsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new CatalogGroupsApi();

  try {
    const data = await api.groupsControllerListGroups();
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

[**Array&lt;ProductGroupResponseDto&gt;**](ProductGroupResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of active product groups |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

