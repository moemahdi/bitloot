
# ProductListResponseDto


## Properties

Name | Type
------------ | -------------
`data` | [Array&lt;ProductResponseDto&gt;](ProductResponseDto.md)
`total` | number
`limit` | number
`offset` | number
`pages` | number

## Example

```typescript
import type { ProductListResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "data": null,
  "total": 150,
  "limit": 24,
  "offset": 0,
  "pages": 7,
} satisfies ProductListResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ProductListResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


