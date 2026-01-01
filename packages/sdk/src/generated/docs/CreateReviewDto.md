
# CreateReviewDto


## Properties

Name | Type
------------ | -------------
`orderId` | string
`productId` | string
`rating` | number
`title` | string
`content` | string
`authorName` | string

## Example

```typescript
import type { CreateReviewDto } from ''

// TODO: Update the object below with actual values
const example = {
  "orderId": 550e8400-e29b-41d4-a716-446655440000,
  "productId": 550e8400-e29b-41d4-a716-446655440001,
  "rating": 5,
  "title": Great product, fast delivery!,
  "content": I received my key instantly after payment. Works perfectly!,
  "authorName": John D.,
} satisfies CreateReviewDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateReviewDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


