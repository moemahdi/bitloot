
# BundleProductDto


## Properties

Name | Type
------------ | -------------
`productId` | string
`displayOrder` | number
`isBonus` | boolean
`discountPercent` | number

## Example

```typescript
import type { BundleProductDto } from ''

// TODO: Update the object below with actual values
const example = {
  "productId": null,
  "displayOrder": null,
  "isBonus": null,
  "discountPercent": null,
} satisfies BundleProductDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BundleProductDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


