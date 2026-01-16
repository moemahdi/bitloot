
# FlashDealProductDto


## Properties

Name | Type
------------ | -------------
`productId` | string
`discountPercent` | number
`discountPrice` | string
`displayOrder` | number
`isFeatured` | boolean
`stockLimit` | number

## Example

```typescript
import type { FlashDealProductDto } from ''

// TODO: Update the object below with actual values
const example = {
  "productId": null,
  "discountPercent": null,
  "discountPrice": null,
  "displayOrder": null,
  "isFeatured": null,
  "stockLimit": null,
} satisfies FlashDealProductDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as FlashDealProductDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


