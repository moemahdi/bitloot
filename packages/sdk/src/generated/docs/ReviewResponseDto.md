
# ReviewResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`rating` | number
`title` | string
`content` | string
`authorName` | string
`isVerifiedPurchase` | boolean
`productName` | string
`createdAt` | Date

## Example

```typescript
import type { ReviewResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": 550e8400-e29b-41d4-a716-446655440000,
  "rating": 5,
  "title": Great product!,
  "content": Fast delivery and works perfectly.,
  "authorName": John D.,
  "isVerifiedPurchase": true,
  "productName": Product Name,
  "createdAt": 2025-01-15T10:30Z,
} satisfies ReviewResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ReviewResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


