
# AdminProductsListResponseDto


## Properties

Name | Type
------------ | -------------
`products` | [Array&lt;AdminProductResponseDto&gt;](AdminProductResponseDto.md)
`total` | number
`page` | number
`limit` | number
`totalPages` | number

## Example

```typescript
import type { AdminProductsListResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "products": null,
  "total": null,
  "page": null,
  "limit": null,
  "totalPages": null,
} satisfies AdminProductsListResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminProductsListResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


