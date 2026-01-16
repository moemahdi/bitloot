
# AddBundleProductDto


## Properties

Name | Type
------------ | -------------
`productId` | string
`discountPercent` | number
`displayOrder` | number
`isBonus` | boolean

## Example

```typescript
import type { AddBundleProductDto } from ''

// TODO: Update the object below with actual values
const example = {
  "productId": null,
  "discountPercent": null,
  "displayOrder": null,
  "isBonus": null,
} satisfies AddBundleProductDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AddBundleProductDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


