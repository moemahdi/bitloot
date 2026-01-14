
# ReviewOrderItemDto


## Properties

Name | Type
------------ | -------------
`productId` | string
`productTitle` | string
`productSlug` | string
`quantity` | number

## Example

```typescript
import type { ReviewOrderItemDto } from ''

// TODO: Update the object below with actual values
const example = {
  "productId": 550e8400-e29b-41d4-a716-446655440001,
  "productTitle": Grand Theft Auto V,
  "productSlug": grand-theft-auto-v,
  "quantity": 1,
} satisfies ReviewOrderItemDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ReviewOrderItemDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


