
# CreateOrderItemDto


## Properties

Name | Type
------------ | -------------
`productId` | string
`quantity` | number
`discountPercent` | number
`bundleId` | string

## Example

```typescript
import type { CreateOrderItemDto } from ''

// TODO: Update the object below with actual values
const example = {
  "productId": 52b45262-731b-4730-a409-709e1bd16797,
  "quantity": 1,
  "discountPercent": 15,
  "bundleId": 52b45262-731b-4730-a409-709e1bd16797,
} satisfies CreateOrderItemDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateOrderItemDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


