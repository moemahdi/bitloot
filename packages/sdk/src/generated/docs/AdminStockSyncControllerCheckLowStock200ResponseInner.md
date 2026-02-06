
# AdminStockSyncControllerCheckLowStock200ResponseInner


## Properties

Name | Type
------------ | -------------
`productId` | string
`productTitle` | string
`slug` | string
`available` | number
`threshold` | number
`autoUnpublish` | boolean

## Example

```typescript
import type { AdminStockSyncControllerCheckLowStock200ResponseInner } from ''

// TODO: Update the object below with actual values
const example = {
  "productId": null,
  "productTitle": null,
  "slug": null,
  "available": null,
  "threshold": null,
  "autoUnpublish": null,
} satisfies AdminStockSyncControllerCheckLowStock200ResponseInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminStockSyncControllerCheckLowStock200ResponseInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


