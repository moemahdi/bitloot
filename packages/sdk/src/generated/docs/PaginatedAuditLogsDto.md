
# PaginatedAuditLogsDto


## Properties

Name | Type
------------ | -------------
`data` | [Array&lt;AuditLogResponseDto&gt;](AuditLogResponseDto.md)
`total` | number
`limit` | number
`offset` | number
`pages` | number

## Example

```typescript
import type { PaginatedAuditLogsDto } from ''

// TODO: Update the object below with actual values
const example = {
  "data": null,
  "total": null,
  "limit": null,
  "offset": null,
  "pages": null,
} satisfies PaginatedAuditLogsDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PaginatedAuditLogsDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


