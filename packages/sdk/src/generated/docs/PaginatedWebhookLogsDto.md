
# PaginatedWebhookLogsDto


## Properties

Name | Type
------------ | -------------
`data` | [Array&lt;WebhookLogListItemDto&gt;](WebhookLogListItemDto.md)
`total` | number
`page` | number
`limit` | number
`totalPages` | number
`hasNextPage` | boolean

## Example

```typescript
import type { PaginatedWebhookLogsDto } from ''

// TODO: Update the object below with actual values
const example = {
  "data": null,
  "total": 500,
  "page": 1,
  "limit": 20,
  "totalPages": 25,
  "hasNextPage": true,
} satisfies PaginatedWebhookLogsDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PaginatedWebhookLogsDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


