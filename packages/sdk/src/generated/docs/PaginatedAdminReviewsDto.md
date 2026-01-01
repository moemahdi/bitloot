
# PaginatedAdminReviewsDto


## Properties

Name | Type
------------ | -------------
`data` | [Array&lt;AdminReviewResponseDto&gt;](AdminReviewResponseDto.md)
`total` | number
`page` | number
`limit` | number
`totalPages` | number

## Example

```typescript
import type { PaginatedAdminReviewsDto } from ''

// TODO: Update the object below with actual values
const example = {
  "data": null,
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10,
} satisfies PaginatedAdminReviewsDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PaginatedAdminReviewsDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


